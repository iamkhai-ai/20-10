"""Rebuild the authored exterior. Run with Blender --background --python this-file.

Modeling coordinates in this script match Three.js: X right, Y up, Z front.
The conversion to Blender coordinates is explicit and glTF exports Y-up again.
"""
import bpy
import math
import random
import sys
from pathlib import Path
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'models' / 'exterior-house-tree.glb'
SOURCE = Path(__file__).with_name('exterior-house-tree.blend')
RNG = random.Random(2010)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.materials, bpy.data.images):
    for block in list(datablocks):
        if block.users == 0:
            datablocks.remove(block)

def B(v):
    return (v[0], -v[2], v[1])

def empty(name, pos=(0, 0, 0), parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = B(pos)
    if parent:
        parent_keep(obj, parent)
    return obj

def parent_keep(obj, parent):
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world

def noise(size, cells, seed):
    rng = np.random.default_rng(seed)
    a = rng.random((cells + 1, cells + 1))
    x = np.linspace(0, cells, size, endpoint=False)
    xi = x.astype(int)
    f = x - xi
    f = f * f * (3 - 2 * f)
    bottom = a[xi[:, None], xi[None, :]] * (1-f[None, :]) + a[xi[:, None], xi[None, :]+1] * f[None, :]
    top = a[xi[:, None]+1, xi[None, :]] * (1-f[None, :]) + a[xi[:, None]+1, xi[None, :]+1] * f[None, :]
    return bottom * (1-f[:, None]) + top * f[:, None]

def image(name, rgb, normal=False):
    h, w = rgb.shape[:2]
    pixels = np.ones((h, w, 4), dtype=np.float32)
    pixels[:, :, :3] = np.clip(rgb, 0, 1)
    im = bpy.data.images.new(name, width=w, height=h, alpha=False)
    im.colorspace_settings.name = 'Non-Color' if normal else 'sRGB'
    im.pixels.foreach_set(pixels.ravel())
    im.pack()
    return im

def material(name, color, roughness=.8, texture=None, normal=None, alpha=1, metallic=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = (*color, alpha)
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Alpha'].default_value = alpha
    if texture:
        tex = m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = texture
        m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    if normal:
        tex = m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = normal
        nm = m.node_tree.nodes.new('ShaderNodeNormalMap')
        m.node_tree.links.new(tex.outputs['Color'], nm.inputs['Color'])
        m.node_tree.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    if alpha < 1:
        m.surface_render_method = 'DITHERED'
        m.use_backface_culling = False
    return m

def textured(name, rgb, strength, roughness):
    n = 512
    yy, xx = np.mgrid[0:n, 0:n] / n
    grain = noise(n, 64, len(name))*.5 + noise(n, 12, len(name)+1)*.3 + noise(n, 4, 3)*.2 - .5
    if name == 'Lime plaster':
        height = grain * .15
        variation = grain * .016
    elif name == 'Oak':
        height = np.sin(xx * 190 + noise(n, 7, 8)*12) * .18 + grain*.15
        variation = height * .13
    elif name == 'Bark':
        height = np.sin(xx * 95 + noise(n, 6, 9)*9)*.15 + grain*.25
        variation = height*.14
    else:
        height = grain*.4
        variation = grain*.12
    base = np.array(rgb)[None, None, :] * (1 + variation[:, :, None])
    gx, gy = np.gradient(height)
    normal = np.stack((-gx*strength, -gy*strength, np.ones_like(gx)), axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    return material(name, rgb, roughness, image(name+' color', base), image(name+' normal', normal*.5+.5, True))

plaster = textured('Lime plaster', (.88, .83, .72), 2, .94)
oak = textured('Oak', (.47, .30, .17), 6, .72)
bark = textured('Bark', (.34, .29, .21), 5, .96)
clay = [textured('Clay '+str(i), col, 6, .87) for i, col in enumerate([(.49,.25,.16),(.55,.29,.19),(.46,.23,.16)])]
trim = material('Ivory painted joinery', (.73,.72,.61), .65)
sage = material('Muted sage shutters', (.26,.34,.25), .84)
stone = material('Warm limestone', (.52,.49,.41), .96)
dark = material('Deep timber shadow', (.12,.10,.075), .9)
linen = material('Linen curtain', (.88,.81,.65), .99)
brass = material('Aged brass', (.38,.27,.12), .37, metallic=.72)
glass = material('Clear warm glazing', (.74,.85,.81), .12, alpha=.16)
interior = material('Warm room backing', (.22,.13,.07), .95)
interior.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value = (.32,.16,.065,1)
interior.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value = .12

leaf_mats = []
for i, col in enumerate([(.34,.43,.21), (.42,.51,.27), (.47,.54,.31), (.29,.38,.19)]):
    n = 128
    yy, xx = np.mgrid[0:n, 0:n]/n
    vein = np.exp(-((xx-.5)*70)**2)*.12
    sideveins = np.maximum(0, np.cos(yy*70 + np.abs(xx-.5)*45))**18 * .045
    tone = .88 + np.sin(yy*math.pi)*.15 + vein + sideveins
    lm = material('Leaf '+str(i), col, .9, image('Leaf veins '+str(i), np.array(col)[None,None,:]*tone[:,:,None]))
    lm.use_backface_culling = False
    leaf_mats.append(lm)

asset = empty('exterior_asset')
house = empty('house', parent=asset)
roof = empty('roof', parent=house)
window = empty('upper_window', parent=house)
tree = empty('tree_structure', parent=asset)
sway = empty('tree_sway', (2.8,4.65,.8), asset)
anchor = empty('window_target', (1.08,3.6,1.97), asset)

def box(name, pos, dims, mat, parent=house, bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=B(pos))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (dims[0], dims[2], dims[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Crafted edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        mod.harden_normals = True
        mod = obj.modifiers.new('Face normals', 'WEIGHTED_NORMAL')
        mod.keep_sharp = True
    parent_keep(obj, parent)
    return obj

def mesh(name, verts, faces, mat, parent=house, uvs=None, smooth=False):
    data = bpy.data.meshes.new(name)
    data.from_pydata([B(v) for v in verts], [], faces)
    data.materials.append(mat)
    data.update()
    if uvs:
        layer = data.uv_layers.new(name='UVMap')
        for poly in data.polygons:
            for li in poly.loop_indices:
                layer.data[li].uv = uvs[data.loops[li].vertex_index]
    for p in data.polygons:
        p.use_smooth = smooth
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    parent_keep(obj, parent)
    return obj

def cut(obj, pos, dims):
    cutter = box('Temporary aperture', pos, dims, dark, bevel=0)
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new('True window opening', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    # Apply to unbeveled wall first, then finish the aperture edges.
    bpy.ops.object.modifier_move_up(modifier=mod.name)
    if len(obj.modifiers)>1:
        bpy.ops.object.modifier_move_up(modifier=mod.name)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

def tube(name, points, radii, mat, parent=tree, radial=10, steps=42):
    pts = [Vector(p) for p in points]
    samples=[]
    for j in range(steps+1):
        q=j/steps*(len(pts)-1)
        idx=min(len(pts)-2,int(q)); t=q-idx
        p0=pts[max(0,idx-1)];p1=pts[idx];p2=pts[idx+1];p3=pts[min(len(pts)-1,idx+2)]
        p=(p1*2+(-p0+p2)*t+(p0*2-p1*5+p2*4-p3)*t*t+(-p0+p1*3-p2*3+p3)*t*t*t)*.5
        r=radii[idx]*(1-t)+radii[idx+1]*t
        samples.append((p,r))
    verts=[];uv=[];faces=[]
    for j,(p,r) in enumerate(samples):
        direction=(samples[min(steps,j+1)][0]-samples[max(0,j-1)][0]).normalized()
        ref=Vector((0,1,0)) if abs(direction.y)<.94 else Vector((1,0,0))
        side=direction.cross(ref).normalized(); other=direction.cross(side).normalized()
        for k in range(radial+1):
            a=k/radial*math.tau
            ripple=1+.07*math.sin(a*3+j*.11)
            v=p+(side*math.cos(a)+other*math.sin(a))*r*ripple
            verts.append(tuple(v));uv.append((k/radial,j/steps*3))
    for j in range(steps):
        for k in range(radial):
            a=j*(radial+1)+k;b=a+radial+1
            faces.append((a,b,b+1,a+1))
    return mesh(name,verts,faces,mat,parent,uv,True)

# A masonry shell with real apertures, rather than windows over solid boxes.
box('Foundation', (0,.14,0),(4.68,.28,3.58),stone,bevel=.045)
front1=box('Lower plaster facade',(0,1.43,1.65),(4.42,2.36,.20),plaster,bevel=.018)
front2=box('Upper plaster facade',(0,3.56,1.65),(4.42,1.94,.20),plaster,bevel=.018)
cut(front1,(-.38,1.22,1.65),(.92,1.96,.8))
for x in (-1.57,1.27):
    cut(front1,(x,1.48,1.65),(.70,1.12,.8))
cut(front2,(1.08,3.6,1.65),(1.82,1.32,.8))
cut(front2,(-1.40,3.6,1.65),(.64,.95,.8))
box('Back plaster wall',(0,2.42,-1.65),(4.42,4.18,.20),plaster)
for x in (-2.15,2.15):
    side=box('Side plaster wall',(x,2.42,0),(.20,4.18,3.3),plaster)
    if x>0:
        for y in (1.5,3.6):
            cut(side,(x,y,-.45),(.8,1.1,.8))
            box('Side oak frame',(x+.09,y,-.45),(.09,1.18,.88),oak)
            box('Side glass',(x+.15,y,-.45),(.018,.98,.68),glass,bevel=0)
            box('Side mullion',(x+.17,y,-.45),(.04,1.02,.04),trim,bevel=.008)
for y in (.4,2.64):
    box('Limestone belt',(0,y,1.79),(4.52,.09,.10),stone,bevel=.015)
    box('Side limestone belt',(2.27,y,0),(.10,.09,3.5),stone,bevel=.015)
for z in (-1.65,1.65):
    verts=[(-2.2,4.5,z),(2.2,4.5,z),(0,5.55,z),(-2.2,4.5,z-.16),(2.2,4.5,z-.16),(0,5.55,z-.16)]
    mesh('Plaster gable',verts,[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)],plaster)

# Roof: continuous shadow silhouette plus rows of curved, overlapping clay tiles.
for sign in (-1,1):
    verts=[(0,5.55,-1.98),(sign*2.48,4.36,-1.98),(sign*2.48,4.36,1.98),(0,5.55,1.98)]
    mesh('Oak roof soffit',verts,[(0,1,2,3)],oak,roof,[(0,0),(1,0),(1,1),(0,1)])
    for row in range(10):
        u0=row*.245
        for col in range(15):
            z0=-2.0+col*.267
            verts=[];uv=[];faces=[]
            for a in range(4):
                u=u0+a/3*.30
                for b in range(5):
                    v=b/4
                    z=z0+v*.278
                    h=.033*math.sin(v*math.pi)+.015+row*.001
                    verts.append((sign*u,5.56-u*.48+h,z))
                    uv.append((v,a/3))
            for a in range(3):
                for b in range(4):
                    k=a*5+b
                    face=(k,k+5,k+6,k+1)
                    faces.append(face if sign<0 else face[::-1])
            mesh('Clay roof tile',verts,faces,clay[(row+col*7)%3],roof,uv,True)
    tube('Carved eave',[(sign*2.48,4.36,-2.02),(sign*2.48,4.36,2.02)],[.046,.046],oak,roof,8,4)
    tube('Front fascia',[(0,5.55,2.0),(sign*2.48,4.36,2.0)],[.06,.06],trim,roof,8,4)
for j in range(16):
    tube('Ridge cap',[(0,5.59,-2+j*.254),(0,5.59,-1.72+j*.254)],[.075,.075],clay[1],roof,12,2)
box('Chimney',(-1.35,5.18,-.65),(.38,1.03,.45),plaster,roof,.015)
box('Chimney cap',(-1.35,5.71,-.65),(.48,.09,.55),stone,roof,.015)

def frame_window(cx,cy,w,h,parent=house,shutters=False):
    z=1.81
    box('Room shadow',(cx,cy,1.34),(w+.07,h+.08,.045),interior,parent,.005)
    box('Clear window panes',(cx,cy,z),(w-.05,h-.05,.012),glass,parent,.002)
    for dx in (-w*.5,w*.5):
        box('Window jamb',(cx+dx,cy,z+.028),(.09,h+.15,.12),trim,parent,.015)
    for dy in (-h*.5,h*.5):
        box('Window rail',(cx,cy+dy,z+.028),(w+.09,.085,.12),trim,parent,.012)
    box('Central casement',(cx,cy,z+.05),(.065,h,.09),trim,parent,.01)
    box('Casement lower bar',(cx,cy-h*.12,z+.05),(w,.035,.065),trim,parent,.007)
    box('Limestone sill',(cx,cy-h*.5-.075,z+.08),(w+.30,.11,.30),stone,parent,.022)
    if shutters:
        for dx in (-w*.5-.24,w*.5+.24):
            box('Shutter backing',(cx+dx,cy,z-.01),(.30,h+.06,.055),sage,parent,.009)
            for j in range(9):
                box('Shutter louver',(cx+dx,cy-h*.4+j*h*.1,z+.03),(.255,.045,.055),sage,parent,.008)
    return z

for x in (-1.57,1.27):
    frame_window(x,1.48,.70,1.12)
frame_window(-1.40,3.6,.64,.95)
frame_window(1.08,3.6,1.82,1.32,window,True)
for x in (.44,1.72):
    verts=[];uv=[];faces=[]
    for j in range(13):
        v=j/12
        for i in range(25):
            u=i/24
            fold=math.cos(u*math.pi*6)*.035
            verts.append((x+(u-.5)*(.33+v*.045),3.6+(.5-v)*1.18,1.67+fold))
            uv.append((u,v))
    for j in range(12):
        for i in range(24):
            a=j*25+i;faces.append((a,a+25,a+26,a+1))
    mesh('Linen drapery',verts,faces,linen,window,uv,True)
box('Window lintel',(1.08,4.34,1.84),(2.13,.10,.19),stone,window,.022)
box('Window latch',(1.13,3.56,1.94),(.025,.12,.045),brass,window,.01)

# Door: recessed panels and restrained porch details.
box('Door leaf',(-.38,1.22,1.64),(.91,1.93,.10),oak)
for x in (-.88,.12):
    box('Door architrave',(x,1.25,1.82),(.10,2.08,.14),trim)
box('Door lintel',(-.38,2.30,1.82),(1.10,.12,.14),trim)
for y,h in ((.78,.61),(1.56,.57)):
    box('Recessed door panel',(-.38,y,1.71),(.65,h,.025),dark,bevel=.009)
    box('Raised oak panel',(-.38,y,1.73),(.57,h-.08,.025),oak,bevel=.012)
box('Brass handle',(-.05,1.25,1.80),(.025,.13,.045),brass,bevel=.01)
for y,z in ((.12,2.01),(.06,2.25)):
    box('Entry stone step',(-.38,y,z),(1.24,.12,.42),stone,bevel=.025)
box('Porch canopy',(-.38,2.48,1.99),(1.45,.10,.85),oak)
for x in (-1.0,.25):
    tube('Porch bracket',[(x,2.18,1.76),(x,2.43,2.17)],[.03,.03],oak,house,8,4)
for i in range(10):
    box('Porch tile',(-1.08+i*.15,2.55,2.0),(.145,.065,.88),clay[i%3],bevel=.02)
tube('Copper downpipe',[(-2.28,4.31,1.78),(-2.31,3.9,1.81),(-2.31,.35,1.81),(-2.4,.22,1.90)],[.025]*4,brass,house,8,20)

# A mature tree with tapering limbs; the opening remains clear of branches/leaves.
tube('Mature trunk',[(2.76,0,.15),(2.86,.8,.08),(2.78,1.8,.18),(2.91,2.8,.32),(2.76,3.8,.58),(2.62,4.7,.80),(2.85,5.42,.6)],[.26,.23,.20,.16,.12,.075,.018],bark)
branch_specs=[
 ([(2.86,2.8,.32),(2.7,3.65,.87),(2.27,4.30,1.65),(1.58,4.59,1.85),(.85,4.73,1.78)],[.14,.11,.075,.042,.008]),
 ([(2.8,3.5,.5),(3.18,4.05,1.15),(3.44,4.65,1.45),(3.24,5.3,1.58)],[.12,.085,.048,.008]),
 ([(2.7,4.35,.7),(2.0,4.9,.4),(1.5,5.4,.1),(1.06,5.65,.3)],[.085,.06,.032,.008]),
 ([(2.8,4.7,.6),(3.3,5.2,.3),(3.75,5.66,.0)],[.065,.04,.006]),
 ([(2.9,3.0,.3),(3.25,3.55,1.4),(3.05,3.95,2.0)],[.10,.052,.006]),
 ([(2.8,4.0,.5),(3.32,4.53,-.3),(3.5,5.10,-.65)],[.08,.045,.006]),
]
for points,radii in branch_specs:
    tube('Tapered limb',points,radii,bark)
for i in range(5):
    a=i/5*math.tau
    tube('Exposed root',[(2.76,.35,.15),(2.76+math.cos(a)*.28,.10,.15+math.sin(a)*.28),(2.76+math.cos(a)*.65,.025,.15+math.sin(a)*.65)],[.13,.095,.008],bark,steps=16)

leaf_verts=[[] for _ in leaf_mats];leaf_faces=[[] for _ in leaf_mats];leaf_uv=[[] for _ in leaf_mats]
clusters=[(1.2,4.98,1.6,.76,.40,.61,700),(2.05,5.47,.15,.88,.56,.75,1050),(3.05,5.58,.25,.98,.63,.82,1450),(3.6,4.85,1.15,.72,.74,.62,1050),(3.18,4.11,1.85,.42,.54,.35,620),(2.86,3.55,1.92,.26,.40,.25,280),(3.40,5.03,-.68,.80,.58,.64,780),(2.40,5.05,1.08,.74,.46,.62,900)]
for cx,cy,cz,rx,ry,rz,count in clusters:
    for _ in range(count):
        # Sample a loose volume, not a visible sphere carrying giant leaves.
        a=RNG.random()*math.tau;b=RNG.uniform(-1,1);rr=RNG.random()**.40
        p=Vector((cx+math.cos(a)*math.sqrt(1-b*b)*rr*rx,cy+b*rr*ry,cz+math.sin(a)*math.sqrt(1-b*b)*rr*rz))
        if .04<p.x<2.13 and 2.88<p.y<4.35 and p.z>1.48:
            continue
        idx=RNG.choices(range(4),[3,4,2,2])[0]
        length=RNG.uniform(.13,.205);width=length*RNG.uniform(.46,.64)
        angle=RNG.random()*math.tau
        along=Vector((math.cos(angle)*.7,RNG.uniform(-.7,.8),math.sin(angle)*.7)).normalized()
        across=along.cross(Vector((0,1,0))).normalized()
        if across.length<.1: across=Vector((1,0,0))
        normal=across.cross(along).normalized()
        vv=[p-along*length*.5,p-along*length*.14-across*width*.5,p+along*length*.28-across*width*.34,p+along*length*.5,p+along*length*.28+across*width*.34,p-along*length*.14+across*width*.5,p+normal*length*.12]
        base=len(leaf_verts[idx]);leaf_verts[idx].extend([tuple(v) for v in vv])
        leaf_uv[idx].extend([(.5,0),(0,.35),(.15,.8),(.5,1),(.85,.8),(1,.35),(.5,.5)])
        for k in range(6): leaf_faces[idx].append((base+k,base+(k+1)%6,base+6))
for i,m in enumerate(leaf_mats):
    mesh('Botanical canopy '+str(i),leaf_verts[i],leaf_faces[i],m,sway,leaf_uv[i],True)

# Merge static repetitions by material under each named part, applying bevels first.
for parent in (roof,window,house,tree):
    buckets={}
    for obj in list(parent.children):
        if obj.type=='MESH': buckets.setdefault(obj.data.materials[0].name,[]).append(obj)
    for material_name,objects in buckets.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
            bpy.context.view_layer.objects.active=obj
            for mod in list(obj.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        bpy.context.object.name=parent.name+' / '+material_name

OUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in [asset]+list(asset.children_recursive): obj.select_set(True)
bpy.context.view_layer.objects.active=asset
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_cameras=False,export_lights=False,export_animations=False,export_extras=True)

# Source preview rig is excluded from GLB, and stays editable in the .blend.
world=bpy.data.worlds.new('Warm studio sky')
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.68,.74,.80,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.45
bpy.context.scene.world=world
for name,pos,power,size in [('Afternoon key',(1,9,7),1300,5),('Sky fill',(-5,5,1),650,6)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=B(pos)
    obj.rotation_euler=(Vector(B((.4,2.5,.1)))-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Asset preview');cam=bpy.data.objects.new('Asset preview',data);bpy.context.collection.objects.link(cam)
cam.location=B((8.5,6.6,11.8));cam.rotation_euler=(Vector(B((.5,2.8,.3)))-cam.location).to_track_quat('-Z','Y').to_euler();data.lens=48
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1000;scene.render.resolution_y=850;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
if '--preview' in sys.argv:
    preview=Path(sys.argv[sys.argv.index('--preview')+1]);preview.parent.mkdir(parents=True,exist_ok=True)
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(preview)
    bpy.ops.render.render(write_still=True)
print('EXTERIOR_EXPORT_OK',OUT,OUT.stat().st_size)
