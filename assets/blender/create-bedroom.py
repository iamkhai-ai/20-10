"""Original bedroom asset. Blender 4.5 LTS: --background --python this-file.
Model in Three.js X-right, Y-up, Z-front; export a separate cutaway scene.
"""
import bpy
import math
import random
import sys
from pathlib import Path
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/models/bedroom.glb'
SOURCE = Path(__file__).with_name('bedroom.blend')
RNG = random.Random(201020)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)


def B(p): return (p[0], -p[2], p[1])


def empty(name, pos=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = B(pos)
    if parent: parent_keep(o, parent)
    return o


def parent_keep(o, parent):
    bpy.context.view_layer.update()
    world = o.matrix_world.copy()
    o.parent = parent
    o.matrix_world = world


def mat(name, color, rough=.8, grain=None, emission=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = (*color, 1)
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = rough
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*color, 1)
        bsdf.inputs['Emission Strength'].default_value = emission
    if grain:
        n = 256
        yy, xx = np.mgrid[0:n, 0:n] / n
        noise = np.random.default_rng(len(name)).random((n, n)) - .5
        if grain == 'wood':
            strength = .009 if name == 'Pale floor oak' else .015
            variation = np.sin(xx*180 + np.sin(yy*15)*1.7)*strength + noise*.004
        elif grain == 'fabric':
            variation = (np.sin(xx*700) + np.sin(yy*700))*.009 + noise*.015
        else: variation = noise*.013
        rgba = np.ones((n, n, 4), dtype=np.float32)
        rgba[:, :, :3] = np.clip(np.array(color) + variation[:, :, None], 0, 1)
        im = bpy.data.images.new(name+' surface', width=n, height=n, alpha=False)
        im.pixels.foreach_set(rgba.ravel()); im.pack()
        tex = m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = im
        m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    return m


ivory = mat('Warm limewash', (.83,.77,.66), grain='plaster')
sage = mat('Sage paneling', (.43,.52,.39))
trim = mat('Painted ivory', (.88,.83,.73), .65)
oak = mat('Honey oak', (.59,.39,.22), .62, 'wood')
floorwood = mat('Pale floor oak', (.70,.56,.38), .85, 'wood')
linen = mat('Unbleached linen', (.88,.83,.72), .96, 'fabric')
rose = mat('Dusty rose quilt', (.68,.38,.40), .94, 'fabric')
throw = mat('Sage woven throw', (.46,.54,.42), .96, 'fabric')
cream = mat('Ivory cotton', (.92,.87,.77), .96, 'fabric')
brass = mat('Soft aged brass', (.56,.38,.16), .38)
ceramic = mat('Hand thrown clay', (.62,.29,.19), .64, 'plaster')
soil = mat('Dark potting earth', (.13,.10,.065), 1, 'plaster')
green = mat('Living leaf', (.25,.42,.23), .72)
leaflight = mat('Young leaf', (.42,.56,.29), .75)
canmat = mat('Sage enamel', (.46,.62,.50), .32)
dark = mat('Quiet shadow', (.18,.24,.17), .9)
gold = mat('Lamp linen glow', (.96,.78,.43), .85, emission=.15)
sky = mat('Window daylight', (.70,.83,.82), .98, emission=.35)
bookrose = mat('Book rose', (.57,.29,.29))

bedroom = empty('bedroom')
shell = empty('room_shell', parent=bedroom)
desk = empty('desk', parent=bedroom)
pot = empty('plant_pot', (1.10,1.085,-.88), bedroom)
plant = empty('plant_rest', (1.10,1.40,-.88), bedroom)
can = empty('watering_can', (1.91,1.085,-.85), bedroom)
cleft = empty('curtain_left', (.02,2.94,-1.78), bedroom)
cright = empty('curtain_right', (2.09,2.94,-1.78), bedroom)


def assign(o, material, parent=shell, smooth=False):
    o.data.materials.append(material)
    if smooth:
        for f in o.data.polygons: f.use_smooth = True
    parent_keep(o, parent)
    return o


def box(name, pos, dims, material, parent=shell, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=B(pos))
    o=bpy.context.object; o.name=name; o.dimensions=B((dims[0],dims[1],-dims[2]))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b=o.modifiers.new('Soft modeled edges','BEVEL'); b.width=bevel; b.segments=3
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return assign(o, material, parent)


def mesh(name, verts, faces, material, parent=shell, uv=None, smooth=True):
    data=bpy.data.meshes.new(name); data.from_pydata([B(v) for v in verts],[],faces); data.update()
    if uv:
        layer=data.uv_layers.new(name='UVMap')
        for loop in data.loops: layer.data[loop.index].uv=uv[loop.vertex_index]
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o)
    return assign(o, material, parent, smooth)


def sphere(name, pos, dims, material, parent=shell):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1, location=B(pos))
    o=bpy.context.object; o.name=name; o.scale=(dims[0],dims[2],dims[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return assign(o,material,parent,True)


def tube(name, points, radius, material, parent=shell):
    data=bpy.data.curves.new(name,'CURVE'); data.dimensions='3D'; data.resolution_u=12
    data.bevel_depth=radius; data.bevel_resolution=2
    s=data.splines.new('BEZIER'); s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points):
        p.co=B(co); p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o)
    data.materials.append(material); parent_keep(o,parent)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    return o


def lathe(name, center, profile, material, parent=shell, sides=40):
    verts=[];uv=[];faces=[]
    for j,(radius,y) in enumerate(profile):
        for i in range(sides+1):
            a=i/sides*math.tau
            verts.append((center[0]+radius*math.cos(a),center[1]+y,center[2]+radius*math.sin(a)))
            uv.append((i/sides,j/(len(profile)-1)))
    for j in range(len(profile)-1):
        for i in range(sides):
            k=j*(sides+1)+i;faces.append((k,k+sides+1,k+sides+2,k+1))
    return mesh(name,verts,faces,material,parent,uv)


def leaf(name, start, end, width, material, parent):
    a=Vector(start);b=Vector(end);d=b-a
    side=Vector((d.z,0,-d.x)).normalized()*width
    c=a+d*.5
    verts=[a,c-side,b,c+side,c+Vector((0,.035,0))]
    return mesh(name,[tuple(v) for v in verts],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],material,parent)


# Quiet cutaway shell with an actual aperture, open ceiling/front/right view.
box('Floor foundation',(0,-.105,.05),(5.75,.17,4.55),oak,bevel=.05)
for j in range(8):
    for i in range(5):
        box('Individual oak floorboard',(-2.25+i*1.12,.005,-1.87+j*.55),(1.108,.045,.539),floorwood,bevel=.008)
box('Left bedroom wall',(-2.83,1.6,.05),(.13,3.2,4.5),ivory)
# Rear wall: opening x .14..1.96, y 1.49..2.81, z -2.1.
for name,pos,dims in [
    ('Rear lower',(0,.735,-2.1),(5.66,1.47,.13)),
    ('Rear upper',(0,3.025,-2.1),(5.66,.39,.13)),
    ('Rear left',(-1.345,2.15,-2.1),(2.97,1.36,.13)),
    ('Rear right',(2.395,2.15,-2.1),(.87,1.36,.13))]: box(name,pos,dims,ivory)
box('Rear sage wainscot',(0,.5,-2.018),(5.65,1.0,.035),sage)
box('Left sage wainscot',(-2.75,.5,.05),(.035,1,4.5),sage)
for x in np.arange(-2.6,2.7,.52): box('Panel stile',(float(x),.5,-1.99),(.028,.88,.025),trim,bevel=.008)
box('Rear chair rail',(0,1.02,-1.985),(5.65,.065,.075),trim)
box('Rear skirting',(0,.12,-1.985),(5.65,.15,.07),trim)
box('Left rail',(-2.7,1.02,.05),(.075,.065,4.5),trim)
box('Left skirting',(-2.7,.12,.05),(.07,.15,4.5),trim)
box('Rear cornice',(0,3.14,-2.0),(5.65,.12,.15),trim)
# Window daylight and layered casing.
box('Distant daylight',(1.05,2.15,-2.22),(1.82,1.32,.025),sky,bevel=0)
for dx in (-.94,.94): box('Window jamb',(1.05+dx,2.15,-1.99),(.09,1.5,.19),trim)
for dy in (-.69,.69): box('Window rail',(1.05,2.15+dy,-1.99),(1.96,.09,.19),trim)
box('Window center',(1.05,2.15,-1.97),(.065,1.32,.1),trim)
box('Window sill',(1.05,1.40,-1.92),(2.14,.11,.35),trim)
tube('Curtain rod',[(-.18,2.99,-1.80),(2.28,2.99,-1.80)],.025,brass)
for x in (-.2,2.3): sphere('Rod finial',(x,2.99,-1.8),(.055,.055,.055),brass)
for parent,cx in ((cleft,.02),(cright,2.09)):
    verts=[];uv=[];faces=[]
    for j in range(25):
        v=j/24
        for i in range(25):
            u=i/24; width=.43+.10*math.cos(v*math.pi)
            verts.append((cx+(u-.5)*width,2.94-v*1.76,-1.78+.055*math.cos(u*math.pi*8)+.02*math.sin(v*math.pi)))
            uv.append((u,v))
    for j in range(24):
        for i in range(24):
            a=j*25+i;faces.append((a,a+25,a+26,a+1))
    mesh('Gathered linen',verts,faces,linen,parent,uv)

# Bed, sculpted upholstery and a draped quilt.
box('Bed oak frame',(-1.64,.36,-.10),(1.56,.21,2.68),oak,bevel=.07)
for x in (-2.25,-1.03):
    for z in (-1.24,1.05): box('Tapered bed foot',(x,.17,z),(.11,.32,.11),oak,bevel=.04)
box('Padded mattress',(-1.64,.56,-.10),(1.51,.32,2.57),cream,bevel=.14)
box('Upholstered headboard',(-1.64,.90,-1.47),(1.67,.97,.16),linen,bevel=.15)
sphere('Arched headboard crown',(-1.64,1.27,-1.47),(.80,.28,.083),linen)
for x in (-2.0,-1.30):
    p=sphere('Soft pillow',(x,.83,-.94),(.34,.16,.36),cream)
    p.rotation_euler[2]=.08 if x< -1.5 else -.09
verts=[];faces=[];uv=[]
for j in range(27):
    v=j/26
    for i in range(21):
        u=i/20;edge=abs(u-.5)*2
        verts.append((-1.64+(u-.5)*1.70,.79-.18*edge**12+.012*math.sin(v*20+u*8),-.54+v*1.85))
        uv.append((u,v))
for j in range(26):
    for i in range(20):
        a=j*21+i;faces.append((a,a+21,a+22,a+1))
mesh('Draped rose quilt',verts,faces,rose,uv=uv)
box('Folded sage throw',(-1.64,.79,.86),(1.68,.08,.48),throw,bevel=.04)
for k in range(12):
    x=-2.4+k*.14
    tube('Throw fringe',[(x,.79,1.09),(x+.01,.72,1.16)],.006,throw)
# Oval woven rug with border and shallow thickness.
o=lathe('Woven oval rug',(-.38,.045,.75),[(0,0),(1.06,0),(1.10,.018),(1.07,.035),(0,.035)],linen,sides=64)
o.scale.y=1.25  # Blender local Y is room depth.
# Small wall shelf, books and botanical picture.
box('Floating shelf',(-1.38,1.95,-1.87),(1.82,.09,.34),oak)
for i,m in enumerate((sage,bookrose,linen,oak)):
    box('Bound book',(-1.93+i*.15,2.18,-1.86),(.12,.37-i*.015,.22),m,bevel=.012)
box('Picture frame',(-1.31,2.65,-1.98),(.67,.64,.06),oak)
box('Picture paper',(-1.31,2.65,-1.94),(.55,.52,.018),cream,bevel=.005)
tube('Botanical stem',[(-1.32,2.43,-1.925),(-1.33,2.65,-1.925),(-1.25,2.82,-1.925)],.007,green)
for j in range(4):
    y=2.50+j*.07; dx=.13 if j%2 else -.14
    leaf('Pressed leaf',(-1.32,y,-1.92),(-1.32+dx,y+.06,-1.91),.04,leaflight,shell)
sphere('Fabric plush body',(-.98,.87,-1.14),(.14,.19,.11),linen)
sphere('Fabric plush head',(-.98,1.08,-1.14),(.13,.12,.10),linen)
for x in (-1.08,-.88): sphere('Plush ear',(x,1.18,-1.14),(.055,.07,.035),linen)
for x in (-1.02,-.94): sphere('Stitched eye',(x,1.10,-1.046),(.009,.009,.006),dark)

# Desk with rounded joinery, drawers and tucked chair.
box('Solid oak desktop',(1.13,1.02,-.97),(2.35,.12,1.05),oak,desk,.055)
for x in (.16,2.10):
    for z in (-1.35,-.6): box('Desk tapered leg',(x,.51,z),(.10,.98,.10),oak,desk,.025)
box('Desk apron',(1.13,.87,-.53),(2.10,.20,.08),oak,desk)
for x in (.61,1.65):
    box('Inset drawer',(x,.87,-.478),(.94,.15,.04),floorwood,desk,.018)
    sphere('Drawer knob',(x,.87,-.44),(.027,.027,.025),brass,desk)
box('Chair seat',(.35,.59,.02),(.57,.12,.55),oak,desk,.09)
for x in (.13,.57):
    for z in (-.17,.23): box('Chair foot',(x,.29,z),(.055,.58,.055),oak,desk,.02)
for x in (.13,.57): tube('Chair back upright',[(x,.62,.23),(x,1.13,.28)],.024,oak,desk)
box('Chair curved back',(.35,1.03,.28),(.54,.25,.07),oak,desk,.065)
# Lamp tucked away from the focal props.
lathe('Lamp base',(.25,1.09,-1.24),[(0,0),(.14,0),(.15,.025),(.12,.055),(0,.055)],brass,desk)
tube('Lamp stem',[(.25,1.13,-1.24),(.25,1.63,-1.24)],.018,brass,desk)
lathe('Pleated lamp shade',(.25,1.51,-1.24),[(.24,0),(.16,.29),(.14,.29),(.22,0)],gold,desk)
for y,m in ((1.10,bookrose),(1.16,linen)):
    box('Desk notebook',(.64,y,-1.28),(.40,.045,.28),m,desk,.015)

# Hollow handmade pot and pre-bloom seedling, independently addressable.
lathe('Pot body',(1.10,1.085,-.88),[(0,0),(.145,0),(.155,.025),(.205,.30),(.225,.31),(.227,.345),(.195,.354),(.183,.315),(.137,.045),(0,.045)],ceramic,pot)
lathe('Visible earth',(1.10,1.085,-.88),[(0,.315),(.19,.315)],soil,pot)
tube('Living stem',[(1.10,1.39,-.88),(1.09,1.61,-.87),(1.14,1.84,-.86)],.012,green,plant)
for j in range(7):
    y=1.45+j*.052; a=j*2.4
    end=(1.1+math.cos(a)*.22,y+.11,-.88+math.sin(a)*.15)
    leaf('Seedling leaf',(1.10,y,-.88),end,.075,green if j%2 else leaflight,plant)

# Rounded watering can: open top, hollow short spout, arch handle.
lathe('Can body',(1.91,1.085,-.85),[(0,0),(.16,0),(.205,.045),(.22,.19),(.18,.30),(.13,.34),(.11,.34),(.105,.30),(.17,.27)],canmat,can)
lathe('Can dark opening',(1.91,1.085,-.85),[(0,.285),(.107,.285)],dark,can)
tube('Can carrying arch',[(1.91,1.34,-1.04),(1.91,1.62,-.88),(1.91,1.36,-.64)],.025,canmat,can)
tube('Can side handle',[(2.08,1.36,-.85),(2.31,1.38,-.85),(2.36,1.19,-.85),(2.10,1.13,-.85)],.025,canmat,can)
tube('Can spout',[(1.75,1.18,-.85),(1.58,1.31,-.85),(1.47,1.49,-.85)],.045,canmat,can)
sphere('Can rose nozzle',(1.46,1.50,-.85),(.065,.055,.075),canmat,can)
for dz in (-.035,0,.035): sphere('Nozzle hole',(1.414,1.53,-.85+dz),(.006,.006,.007),dark,can)

for name,pos in [('window_anchor',(1.05,2.15,-2.0)),('room_target',(0,1.30,-.28)),
                 ('desk_target',(1.40,1.55,-.90)),('pot_target',(1.10,1.48,-.88))]:
    empty(name,pos,bedroom)

# Apply bevels and merge material batches within each independent root.
for parent in (shell,desk,pot,plant,can,cleft,cright):
    buckets={}
    for o in list(parent.children):
        if o.type=='MESH': buckets.setdefault(o.data.materials[0].name,[]).append(o)
    for name,objects in buckets.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:
            o.select_set(True); bpy.context.view_layer.objects.active=o
            for mod in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.context.view_layer.objects.active=objects[0]; bpy.ops.object.join()
        bpy.context.object.name=parent.name+' / '+name

OUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for o in [bedroom]+list(bedroom.children_recursive): o.select_set(True)
bpy.context.view_layer.objects.active=bedroom
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_cameras=False,export_lights=False,export_animations=False)
world=bpy.data.worlds.new('Bedroom warm studio');world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.75,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.5;bpy.context.scene.world=world
for name,pos,power,size in [('Warm afternoon',(3,7,3),700,5),('Window fill',(1,3,-1),90,2)]:
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=B(pos)
    o.rotation_euler=(Vector(B((0,1,0)))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Room source preview');o=bpy.data.objects.new('Room source preview',d);bpy.context.collection.objects.link(o)
o.location=B((6.2,4.8,7.8));o.rotation_euler=(Vector(B((0,1.2,-.3)))-o.location).to_track_quat('-Z','Y').to_euler();d.lens=44
scene=bpy.context.scene;scene.camera=o;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1100;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
if '--preview' in sys.argv:
    p=Path(sys.argv[sys.argv.index('--preview')+1]);p.parent.mkdir(parents=True,exist_ok=True)
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(p);bpy.ops.render.render(write_still=True)
print('BEDROOM_EXPORT_OK', OUT, OUT.stat().st_size)
