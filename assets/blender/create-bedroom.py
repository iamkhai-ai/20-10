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
sys.path.insert(0, str(Path(__file__).resolve().parent))
from bedroom_surfaces import surface, bake_static_occlusion, image, texture

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
    return surface(name, color, rough, grain, emission)


ivory = mat('Warm limewash', (.76,.84,.86), grain='plaster')
sage = mat('Sage paneling', (.69,.76,.69))
trim = mat('Painted ivory', (.90,.87,.79), .65)
oak = mat('Honey oak', (.72,.61,.45), .52, 'wood')
floorwood = mat('Pale floor oak', (.76,.69,.56), .68, 'wood')
linen = mat('Unbleached linen', (.88,.83,.72), .96, 'fabric')
rose = mat('Dusty rose quilt', (.89,.87,.81), .94, 'fabric')
throw = mat('Sage woven throw', (.46,.54,.42), .96, 'fabric')
cream = mat('Ivory cotton', (.92,.87,.77), .96, 'fabric')
brass = mat('Soft aged brass', (.56,.38,.16), .38)
ceramic = mat('Hand thrown clay', (.96,.88,.69), .27, 'plaster')
glaze_cream = mat('Cream glazed rim', (.93,.87,.74), .30)
glaze_rose = mat('Rose painted petals', (.76,.45,.49), .38)
soil = mat('Dark potting earth', (.13,.10,.065), 1, 'plaster')
green = mat('Living leaf', (.25,.42,.23), .72)
leaflight = mat('Young leaf', (.42,.56,.29), .75)
canmat = mat('Sage enamel', (.56,.72,.76), .28, 'enamel')
dark = mat('Quiet shadow', (.18,.24,.17), .9)
gold = mat('Lamp linen glow', (.96,.78,.43), .85, emission=.15)
sky = mat('Window daylight', (.70,.83,.82), .98, emission=.35)
yy,xx=np.mgrid[0:256,0:256]/255
cloud=np.exp(-((xx-.30)/.32)**2-((yy-.72)/.055)**2)*.07
sky_pixels=np.stack((.78-.20*yy+cloud,.85-.10*yy+cloud,.84+.02*yy+cloud),axis=2)
sky_map=texture(sky,image('Soft garden sky',sky_pixels))
sky_bsdf=sky.node_tree.nodes.get('Principled BSDF')
sky.node_tree.links.new(sky_map.outputs['Color'],sky_bsdf.inputs['Base Color'])
sky.node_tree.links.new(sky_map.outputs['Color'],sky_bsdf.inputs['Emission Color'])
bookrose = mat('Book rose', (.57,.29,.29))
seam = mat('Quiet linen seam', (.65,.61,.53), .95)
rose_seam = mat('Rose edge binding', (.68,.68,.59), .95)
glass = mat('Window glass', (.90,.96,.95), .12)
glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.12
glass.diffuse_color=(.90,.96,.95,.12);glass.surface_render_method='DITHERED'

bedroom = empty('bedroom')
shell = empty('room_shell', parent=bedroom)
desk = empty('desk', parent=bedroom)
pot = empty('plant_pot', (1.10,1.085,-.88), bedroom)
plant = empty('plant_rest', (1.10,1.40,-.88), bedroom)
can = empty('watering_can', (1.91,1.085,-.85), bedroom)
cleft = empty('curtain_left', (.02,2.94,-1.78), bedroom)
cright = empty('curtain_right', (2.09,2.94,-1.78), bedroom)
backdrop = empty('window_backdrop', parent=bedroom)


def assign(o, material, parent=shell, smooth=False):
    o.data.materials.append(material)
    if smooth:
        for f in o.data.polygons: f.use_smooth = True
    parent_keep(o, parent)
    return o


def project_uv(o, material):
    kind=material.get('surface_kind')
    if kind not in ('wood','fabric','plaster'):return
    bpy.context.view_layer.update()
    points=[o.matrix_world@v.co for v in o.data.vertices]
    room=[(p.x,p.z,-p.y) for p in points]
    dims=[max(p[a] for p in room)-min(p[a] for p in room) for a in range(3)]
    uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
    offset=(RNG.random(),RNG.random()) if kind=='wood' else (0,0)
    for f in o.data.polygons:
        normal=o.matrix_world.to_3x3()@f.normal;normal=(normal.x,normal.z,-normal.y)
        excluded=max(range(3),key=lambda a:abs(normal[a]))
        axes=[a for a in range(3) if a!=excluded]
        along=max(axes,key=lambda a:dims[a]);across=next(a for a in axes if a!=along)
        for loop in f.loop_indices:
            p=room[o.data.loops[loop].vertex_index]
            uv.data[loop].uv=(p[across]*(4.5 if kind=='wood' else 14 if kind=='fabric' else 1.5)+offset[0],
                              p[along]*(.55 if kind=='wood' else 14 if kind=='fabric' else 1.5)+offset[1])


def box(name, pos, dims, material, parent=shell, bevel=.025, segments=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=B(pos))
    o=bpy.context.object; o.name=name; o.dimensions=B((dims[0],dims[1],-dims[2]))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b=o.modifiers.new('Soft modeled edges','BEVEL'); b.width=bevel; b.segments=segments
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    assign(o, material, parent);project_uv(o,material)
    return o


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


def tapered_leg(name, pos, height, top, bottom, parent):
    verts=[(pos[0]+sx*w/2,pos[1]+y,pos[2]+sz*w/2)
           for y,w in ((-height/2,bottom),(height/2,top)) for sx,sz in ((-1,-1),(1,-1),(1,1),(-1,1))]
    obj=mesh(name,verts,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],oak,parent,smooth=False)
    edge=obj.modifiers.new('Fine eased joinery','BEVEL');edge.width=.008;edge.segments=2
    obj.modifiers.new('Joinery normals','WEIGHTED_NORMAL');project_uv(obj,oak)
    return obj


def tube(name, points, radius, material, parent=shell, radii=None):
    data=bpy.data.curves.new(name,'CURVE'); data.dimensions='3D'
    data.resolution_u=3 if radius<=.008 else 8
    data.bevel_depth=radius; data.bevel_resolution=0 if radius<=.008 else 1
    s=data.splines.new('BEZIER'); s.bezier_points.add(len(points)-1)
    for i,(p,co) in enumerate(zip(s.bezier_points,points)):
        p.co=B(co); p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
        if radii:p.radius=radii[i]
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o)
    data.materials.append(material); parent_keep(o,parent)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    project_uv(o,material)
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
    side=Vector((d.z,0,-d.x)).normalized();verts=[];uv=[];faces=[]
    for j in range(11):
        t=j/10
        for i in range(7):
            s=i/3-1;w=math.sin(math.pi*t)**.75*width
            p=a+d*t+side*(s*w)+Vector((0,(1-s*s)*.018*math.sin(math.pi*t)-.025*t*t,0))
            verts.append(tuple(p));uv.append((i/6,t))
    for j in range(10):
        for i in range(6):
            k=j*7+i;faces.append((k,k+7,k+8,k+1))
    result=mesh(name,verts,faces,material,parent,uv)
    if parent==plant:
        tube('Leaf midrib',[tuple(a),tuple(a+d*.45+Vector((0,.018,0))),tuple(b-Vector((0,.025,0)))],.0016,leaflight,parent)
    return result


def cushion(name, center, half, material):
    verts=[];uv=[];faces=[]
    def signed(v,p):return math.copysign(abs(v)**p,v)
    for j in range(19):
        lat=-math.pi/2+j*math.pi/18;ring=max(0,math.cos(lat))**.55
        for i in range(33):
            a=i/32*math.tau
            x=half[0]*signed(math.cos(a),.52)*ring
            z=half[2]*signed(math.sin(a),.52)*ring
            y=half[1]*math.sin(lat)
            if y>0:y-=.013*ring**5*(1+math.sin(a*7+lat*3))
            verts.append((center[0]+x,center[1]+y,center[2]+z));uv.append((x*14,z*14))
    for j in range(18):
        for i in range(32):
            k=j*33+i;faces.append((k,k+33,k+34,k+1))
    mesh(name,verts,faces,material,uv=uv)
    points=[]
    for i in range(25):
        a=i/24*math.tau
        points.append((center[0]+half[0]*signed(math.cos(a),.52),center[1],center[2]+half[2]*signed(math.sin(a),.52)))
    tube(name+' stitched piping',points,.0035,seam)


def blanket_y(x,z):
    wrinkles=.025*math.sin(z*10+x*4)+.014*math.sin(z*24-x*12)
    side=max(0,(abs(x)-.66)/.20)
    foot=max(0,(z-1.08)/.34)
    return .81+wrinkles-.25*side**1.45-.32*foot**1.3


def blanket(name,zmin,zmax,material,lift=0):
    verts=[];uv=[];faces=[]
    for j in range(39):
        z=zmin+(zmax-zmin)*j/38
        for i in range(33):
            x=(i/32-.5)*1.72
            verts.append((-1.64+x,blanket_y(x,z)+lift,z));uv.append((x*14,z*14))
    for j in range(38):
        for i in range(32):
            k=j*33+i;faces.append((k,k+33,k+34,k+1))
    obj=mesh(name,verts,faces,material,uv=uv)
    thick=obj.modifiers.new('Sewn textile thickness','SOLIDIFY');thick.thickness=.008
    perimeter=[(-1.64+x,blanket_y(x,z)+lift+.003,z) for x,z in
               [(-.86,zmin+j*(zmax-zmin)/14) for j in range(15)]+
               [(-.86+i*1.72/14,zmax) for i in range(1,15)]+
               [(.86,zmax-j*(zmax-zmin)/14) for j in range(1,15)]+
               [(.86-i*1.72/14,zmin) for i in range(1,15)]]
    tube(name+' edge binding',perimeter,.0035,rose_seam if material==rose else seam)


# Quiet cutaway shell with an actual aperture, open ceiling/front/right view.
box('Floor foundation',(0,-.105,.05),(5.75,.17,4.55),oak,bevel=.05)
for i in range(24):
    width=5.6/24;z=-2.15-(i%3)*.48
    while z<2.25:
        start=max(-2.15,z);end=min(2.25,z+1.44)
        if end>start+.01:
            box('Staggered oak floorboard',(-2.8+(i+.5)*width,.002,(start+end)/2),
                (width-.0015,.04,end-start-.0015),floorwood,bevel=.0025,segments=1)
        z+=1.44
box('Left bedroom wall',(-2.83,1.6,.05),(.13,3.2,4.5),ivory)
# Rear wall: opening x .14..1.96, y 1.49..2.81, z -2.1.
for name,pos,dims in [
    ('Rear lower',(0,.735,-2.1),(5.66,1.47,.13)),
    ('Rear upper',(0,3.025,-2.1),(5.66,.39,.13)),
    ('Rear left',(-1.345,2.15,-2.1),(2.97,1.36,.13)),
    ('Rear right',(2.395,2.15,-2.1),(.87,1.36,.13))]: box(name,pos,dims,ivory,bevel=0)
box('Rear sage wainscot',(0,.5,-2.018),(5.65,1.0,.035),sage)
box('Left sage wainscot',(-2.75,.5,.05),(.035,1,4.5),sage)
for x in np.arange(-2.6,2.7,.52): box('Panel stile',(float(x),.5,-1.99),(.028,.88,.025),trim,bevel=.008)
box('Rear chair rail',(0,1.02,-1.985),(5.65,.065,.075),trim)
box('Rear skirting',(0,.12,-1.985),(5.65,.15,.07),trim)
box('Left rail',(-2.7,1.02,.05),(.075,.065,4.5),trim)
box('Left skirting',(-2.7,.12,.05),(.07,.15,4.5),trim)
box('Rear cornice',(0,3.14,-2.0),(5.65,.12,.15),trim)
# Window daylight and layered casing.
mesh('Garden sky through aperture',[(.14,1.49,-2.15),(1.96,1.49,-2.15),(1.96,2.81,-2.15),(.14,2.81,-2.15)],
     [(0,1,2,3)],sky,backdrop,uv=[(0,0),(1,0),(1,1),(0,1)],smooth=False)
box('Thin window glazing',(1.05,2.15,-2.05),(1.80,1.30,.006),glass,bevel=0)
for j in range(2):
    cx=1.50+j*.22;cy=2.24+j*.25
    tube('Outside garden branch',[(cx-.32,cy-.36,-2.12),(cx,cy,-2.12),(cx+.15,cy+.14,-2.12)],.012,oak,backdrop)
    for k in range(8):
        a=k*2.4;px=cx+math.cos(a)*.14;py=cy+math.sin(a)*.16
        verts=[(px,py,-2.115),(px+.035,py+.045,-2.10),(px+.11,py+.10,-2.115),(px+.075,py+.025,-2.10)]
        mesh('Sunlit garden leaf',verts,[(0,1,2),(0,2,3)],green if k%2 else leaflight,backdrop)
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
            uv.append((u*5,v*20))
    for j in range(24):
        for i in range(24):
            a=j*25+i;faces.append((a,a+25,a+26,a+1))
    mesh('Gathered linen',verts,faces,linen,parent,uv)

# Bed, sculpted upholstery and a draped quilt.
box('Bed oak frame',(-1.64,.36,-.10),(1.56,.21,2.68),oak,bevel=.07)
for x in (-2.25,-1.03):
    for z in (-1.24,1.05): box('Tapered bed foot',(x,.17,z),(.11,.32,.11),oak,bevel=.04)
box('Padded mattress',(-1.64,.56,-.10),(1.51,.32,2.57),cream,bevel=.14)
outline=[(-.82,.43),(.82,.43),(.82,1.13)]+[(math.cos(a)*.82,1.13+math.sin(a)*.32) for a in np.linspace(0,math.pi,25)]+[(-.82,1.13)]
verts=[(-1.64+x,y,z) for z in (-1.55,-1.39) for x,y in outline];n=len(outline)
faces=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
head=mesh('One piece upholstered headboard',verts,faces,linen,smooth=False)
b=head.modifiers.new('Padded arch edge','BEVEL');b.width=.045;b.segments=3
head.modifiers.new('Soft upholstery normals','WEIGHTED_NORMAL');project_uv(head,linen)
tube('Headboard piping',[(-1.64+x*.94,.05+(y-.05)*.94,-1.335) for x,y in outline+[outline[0]]],.004,seam)
for x in (-2.01,-1.28):cushion('Sewn cotton pillow',(x,.86,-.96),(.33,.14,.31),cream)
blanket('Naturally folded rose quilt',-.54,1.42,rose)
blanket('Folded sage linen throw',.66,1.14,throw,.022)
for k in range(12):
    x=-2.4+k*.14
    y=blanket_y(x+1.64,1.14)+.022
    tube('Throw fringe',[(x,y,1.14),(x+.01,y-.035,1.21)],.003,throw)
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

# Desk with rounded joinery, drawers and tucked chair.
box('Solid oak desktop',(1.13,1.02,-.97),(2.35,.12,1.05),oak,desk,.055)
for x in (.16,2.10):
    for z in (-1.35,-.6): tapered_leg('Desk tapered leg',(x,.51,z),.98,.105,.055,desk)
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

# Rounded butter-glazed planter, cream saucer/rim and small painted flowers.
lathe('Cream drainage saucer',(1.10,1.085,-.88),[(0,0),(.195,0),(.22,.012),(.222,.025),(.21,.034),(.17,.030),(0,.030)],glaze_cream,pot)
lathe('Rounded glazed pot',(1.10,1.085,-.88),[(0,.026),(.145,.026),(.178,.045),(.213,.11),(.221,.20),(.209,.29),(.200,.325),(.188,.325),(.184,.30),(.193,.20),(.171,.073),(0,.061)],ceramic,pot)
lathe('Cream rolled pot rim',(1.10,1.085,-.88),[(.188,.315),(.201,.315),(.214,.327),(.212,.343),(.20,.351),(.188,.344),(.184,.331),(.188,.315)],glaze_cream,pot)
def painted_oval(name,cx,cy,rx,ry,material):
    coords=[(cx+rx*math.cos(a),cy+ry*math.sin(a)) for a in np.linspace(0,math.tau,13)]
    verts=[(x,1.085+y,-.88+math.sqrt(max(0,.221**2-(x-1.10)**2))+.0015) for x,y in coords]
    mesh(name,verts,[tuple(range(len(verts)))],material,pot,smooth=False)
for cx,cy in ((1.025,.19),(1.185,.16)):
    for j in range(5):
        a=j*math.tau/5
        painted_oval('Hand painted rose petal',cx+math.cos(a)*.022,cy+math.sin(a)*.022,.014,.018,glaze_rose)
    painted_oval('Painted cream flower center',cx,cy,.010,.010,glaze_cream)
lathe('Visible earth',(1.10,1.085,-.88),[(0,.315),(.19,.315)],soil,pot)
for j in range(28):
    a=RNG.random()*math.tau;r=math.sqrt(RNG.random())*.175
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=RNG.uniform(.008,.019),
        location=B((1.10+math.cos(a)*r,1.404+RNG.random()*.004,-.88+math.sin(a)*r)))
    obj=bpy.context.object;obj.name='Loose potting soil';obj.scale.z=.5;assign(obj,soil,pot,True)
tube('Living stem',[(1.10,1.39,-.88),(1.09,1.61,-.87),(1.14,1.84,-.86)],.0045,green,plant)
for j in range(7):
    y=1.45+j*.052; a=j*2.4
    end=(1.1+math.cos(a)*.22,y+.11,-.88+math.sin(a)*.15)
    leaf('Seedling leaf',(1.10,y,-.88),end,.075,green if j%2 else leaflight,plant)

# Slim oval pastel can with one swept handle, rolled rim and a fine spout.
body=lathe('Oval enamel can body',(1.91,1.085,-.85),[(0,0),(.15,0),(.175,.015),(.19,.045),(.195,.16),(.18,.26),(.17,.282),(.157,.282),(.155,.26),(.17,.16),(.15,.045),(0,.04)],canmat,can)
for v in body.data.vertices:v.co.y=.85+(v.co.y-.85)*.78
lip=lathe('Rolled brass filling rim',(1.91,1.085,-.85),[(.157,.276),(.17,.276),(.177,.284),(.172,.292),(.16,.294),(.154,.287),(.157,.276)],brass,can)
for v in lip.data.vertices:v.co.y=.85+(v.co.y-.85)*.78
opening=lathe('Can dark opening',(1.91,1.085,-.85),[(0,.25),(.154,.25)],dark,can)
for v in opening.data.vertices:v.co.y=.85+(v.co.y-.85)*.78
tube('Single swept can handle',[(2.065,1.33,-.85),(2.27,1.39,-.85),(2.32,1.19,-.85),(2.075,1.13,-.85)],.015,canmat,can)
tube('Tapered can spout',[(1.75,1.17,-.85),(1.58,1.27,-.85),(1.43,1.49,-.85)],.033,canmat,can,radii=[1,.70,.43])
axis=Vector((-.55,.835,0)).normalized();across=Vector((0,0,1));up=axis.cross(across)
tip=Vector((1.43,1.49,-.85));verts=[];faces=[]
for t,r in ((-.012,.015),(.008,.020),(.030,.043),(.038,.046),(.042,.041)):
    for i in range(33):
        a=i/32*math.tau;verts.append(tuple(tip+axis*t+(across*math.cos(a)+up*math.sin(a))*r))
for j in range(4):
    for i in range(32):k=j*33+i;faces.append((k,k+33,k+34,k+1))
faces.append(tuple(range(4*33,5*33)))
mesh('Formed brass watering rose',verts,faces,brass,can)
for r,count in ((0,1),(.016,6),(.031,10)):
    for i in range(count):
        a=i/count*math.tau;c=tip+axis*.0425+(across*math.cos(a)+up*math.sin(a))*r
        points=[tuple(c)]+[tuple(c+(across*math.cos(t)+up*math.sin(t))*.0024)
                         for t in np.linspace(0,math.tau,9)]
        mesh('Recessed sprinkler perforation',points,[(0,j,j+1) for j in range(1,9)],dark,can,smooth=False)

for name,pos in [('window_anchor',(1.05,2.15,-2.0)),('room_target',(0,1.30,-.28)),
                 ('desk_target',(1.40,1.55,-.90)),('pot_target',(1.10,1.48,-.88))]:
    empty(name,pos,bedroom)

# Apply bevels and merge material batches within each independent root.
for parent in (shell,desk,pot,plant,can,cleft,cright,backdrop):
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

bake_static_occlusion(bedroom)
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
