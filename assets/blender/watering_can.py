"""Ivory cylindrical can following the user's reference. Three.js Y-up.

Keep the base pivot and rose face at the existing watering calibration.
Used by both the full bedroom build and the targeted prop refresh.
"""
import math
import bpy
from mathutils import Vector


def B(p): return (p[0], -p[2], p[1])


def build_watering_can(parent, blush, cream, brass, dark):
    def mesh(name, vertices, faces, material, uv=None):
        data = bpy.data.meshes.new(name)
        data.from_pydata([B(v) for v in vertices], [], faces); data.update()
        layer = data.uv_layers.new(name='UVMap')
        if uv:
            for loop in data.loops: layer.data[loop.index].uv = uv[loop.vertex_index]
        obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj)
        obj.data.materials.append(material)
        for face in data.polygons: face.use_smooth = True
        bpy.context.view_layer.update(); world = obj.matrix_world.copy()
        obj.parent = parent; obj.matrix_world = world
        return obj

    def lathe(name, profile, material):
        vertices, faces, uv = [], [], []
        for j, (radius, y) in enumerate(profile):
            for i in range(57):
                angle = i / 56 * math.tau
                vertices.append((1.91 + radius * math.cos(angle), 1.085 + y,
                                 -.85 + radius * math.sin(angle)))
                uv.append((i / 56, j / (len(profile) - 1)))
        for j in range(len(profile)-1):
            for i in range(56):
                k = j * 57 + i; faces.append((k, k+57, k+58, k+1))
        return mesh(name, vertices, faces, material, uv)

    def tube(name, points, radius, material, radii=None):
        data = bpy.data.curves.new(name, 'CURVE'); data.dimensions = '3D'
        data.resolution_u = 10; data.bevel_depth = radius; data.bevel_resolution = 2
        spline = data.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
        for i, (point, co) in enumerate(zip(spline.bezier_points, points)):
            point.co = B(co); point.handle_left_type = point.handle_right_type = 'AUTO'
            if radii: point.radius = radii[i]
        obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj)
        data.materials.append(material); bpy.context.view_layer.update()
        world = obj.matrix_world.copy(); obj.parent = parent; obj.matrix_world = world
        bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')
        if not obj.data.uv_layers: obj.data.uv_layers.new(name='UVMap')
        for face in obj.data.polygons: face.use_smooth = True
        return obj

    outer = [(0,0),(.094,0),(.107,.007),(.112,.017),(.113,.042),
             (.113,.275),(.112,.309),(.108,.323),(.101,.329)]
    lathe('Ivory tall cylindrical body',outer+[(.095,.325),(.097,.306),
          (.099,.045),(.091,.025),(0,.025)],blush)
    # Rolled seams and pairs of shallow pressed rings, as in the reference.
    lathe('Rolled ivory base',[(.102,.003),(.113,.004),(.116,.011),(.115,.019),(.110,.023),(.103,.017)],blush)
    for y in (.034,.046,.276,.289):
        lathe('Pressed body ring',[(.1125,y-.002),(.1145,y),(.1145,y+.002),(.1125,y+.004)],blush)
    lathe('Rolled ivory top rim',[(.098,.316),(.108,.316),(.115,.324),(.114,.333),(.107,.338),(.098,.332),(.095,.324),(.098,.316)],blush)
    lathe('Warm shaded filling interior',[(0,.286),(.097,.286)],dark)
    # A partial cover leaves a real rear filling aperture instead of a black lid.
    cap=[(1.91,1.411,-.85)]
    cap.extend((1.91+.097*math.cos(i/28*math.pi),1.411,-.85+.097*math.sin(i/28*math.pi)) for i in range(29))
    mesh('Half covered filling aperture',cap,[(0,i,i+1) for i in range(1,29)],blush)
    handle=tube('Slim arched carrying strap',[(2.01,1.18,-.85),(2.175,1.405,-.85),
          (2.09,1.585,-.85),(1.925,1.585,-.85),(1.83,1.405,-.85)],.0065,blush,[.9,1,1,1,.9])
    # Flatten the strap's section through depth, retaining rounded modeled edges.
    for vertex in handle.data.vertices:vertex.co.y=.85+(vertex.co.y-.85)*1.8
    tube('Upper strap attachment',[(1.829,1.397,-.85),(1.835,1.416,-.85)],.008,blush)
    tube('Lower strap attachment',[(2.005,1.18,-.85),(2.016,1.19,-.85)],.008,blush)

    axis = Vector((-.383,.355,0)).normalized(); across = Vector((0,0,1)); up = axis.cross(across)
    outlet=Vector((1.407,1.525,-.85));tip=outlet-axis*.0425
    tube('Long straight tapered spout',[(1.79,1.17,-.85),tuple(tip)],.023,blush,[1,.48])
    def rose_surface(name, profile, material, face=False):
        vertices, faces, uv = [], [], []
        for j, (t, radius) in enumerate(profile):
            for i in range(41):
                a = i / 40 * math.tau
                vertices.append(tuple(tip + axis*t + (across*math.cos(a)+up*math.sin(a))*radius))
                uv.append((i/40,j/max(1,len(profile)-1)))
        for j in range(len(profile)-1):
            for i in range(40):
                k=j*41+i;faces.append((k,k+41,k+42,k+1))
        if face: faces.append(tuple(range((len(profile)-1)*41,len(profile)*41)))
        return mesh(name,vertices,faces,material,uv)
    rose_surface('Flat circular ivory shower rose',[(-.010,.011),(.010,.014),(.027,.037),(.035,.045),(.042,.043)],blush,True)
    rose_surface('Fine rolled rose edge',[(.034,.0448),(.038,.046),(.042,.0435)],blush)
    # Eight ring holes match the runtime .011-radius jet origins after .82 scaling.
    for i in range(9):
        angle = (i-1)/8*math.tau; radius = 0 if i==0 else .0134
        center = tip+axis*.0425+(across*math.cos(angle)+up*math.sin(angle))*radius
        vertices = [tuple(center)] + [tuple(center+(across*math.cos(a)+up*math.sin(a))*.0018)
            for a in [j/8*math.tau for j in range(9)]]
        obj=mesh('Fine sprinkler opening',vertices,[(0,j,j+1) for j in range(1,9)],dark)
        for face in obj.data.polygons: face.use_smooth=False

