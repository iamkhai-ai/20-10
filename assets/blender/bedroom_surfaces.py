"""Packed PBR surface maps and static occlusion for the original bedroom.

Runs only inside Blender. Movable props do not cast permanent baked shadows.
"""
import math
import bpy
import numpy as np

_images = {}


def noise(n, cells, seed):
    rng = np.random.default_rng(seed)
    a = rng.random((cells+1, cells+1))
    a[-1, :] = a[0, :]; a[:, -1] = a[:, 0]
    p = np.arange(n)*cells/n; i = p.astype(int); f = p-i
    f = f*f*(3-2*f)
    lo = a[i[:, None],i[None, :]]*(1-f[None, :]) + a[i[:, None],i[None, :]+1]*f[None, :]
    hi = a[i[:, None]+1,i[None, :]]*(1-f[None, :]) + a[i[:, None]+1,i[None, :]+1]*f[None, :]
    return lo*(1-f[:, None]) + hi*f[:, None]


def image(name, rgb, noncolor=False):
    if name in _images: return _images[name]
    h,w=rgb.shape[:2]; rgba=np.ones((h,w,4),dtype=np.float32)
    rgba[:,:,:3]=np.clip(rgb,0,1)
    im=bpy.data.images.new(name,width=w,height=h,alpha=False)
    im.colorspace_settings.name='Non-Color' if noncolor else 'sRGB'
    im.pixels.foreach_set(rgba.ravel());im.pack();_images[name]=im
    return im


def texture(material, im, uv_name='UVMap'):
    tree=material.node_tree
    node=tree.nodes.new('ShaderNodeTexImage');node.image=im
    uv=tree.nodes.new('ShaderNodeUVMap');uv.uv_map=uv_name
    tree.links.new(uv.outputs['UV'],node.inputs['Vector'])
    return node


def surface(name, color, roughness=.8, kind=None, emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
    bsdf=m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=(*color,1)
    bsdf.inputs['Roughness'].default_value=roughness
    bsdf.inputs['Metallic'].default_value=.85 if name=='Soft aged brass' else 0
    if emission:
        bsdf.inputs['Emission Color'].default_value=(*color,1)
        bsdf.inputs['Emission Strength'].default_value=emission
    if not kind: return m
    if name=='Hand thrown clay':kind='ceramic'
    if name=='Dark potting earth':kind='soil'
    m['surface_kind']=kind
    n=512 if kind in ('wood','fabric') else 256
    yy,xx=np.mgrid[0:n,0:n]/n
    broad=noise(n,8,17)-.5; fine=noise(n,96,21)-.5
    if kind=='wood':
        warp=xx + .022*np.sin(yy*math.tau*2) + broad*.018
        grain=np.sin(warp*math.tau*76 + noise(n,18,5)*1.8)
        pores=np.maximum(0,grain-.72)**2
        h=grain*.025-pores*.08+fine*.015
        variation=grain*.008 + broad*.035-pores*.025
    elif kind=='fabric':
        warp=np.sin(xx*math.tau*82);weft=np.sin(yy*math.tau*82)
        h=(warp+weft)*.026 + fine*.01
        variation=(warp+weft)*.006 + broad*.015
    elif kind=='ceramic':
        h=np.sin(yy*math.tau*90)*.006 + fine*.06 + broad*.02
        variation=broad*.035+fine*.025
    elif kind=='soil':
        h=noise(n,48,12)*.18+fine*.12
        variation=broad*.025+fine*.035
    elif kind=='enamel':
        h=fine*.007+broad*.004;variation=broad*.008
    else:
        h=fine*.02+broad*.007;variation=broad*.012
    base=np.clip(np.array(color)[None,None,:]+variation[:,:,None],0,1)
    tex=texture(m,image(name+' albedo',base[::2,::2] if kind=='fabric' else base))
    m.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
    dy,dx=np.gradient(h)
    normal=np.stack((-dx*n*.055,-dy*n*.055,np.ones_like(h)),axis=2)
    normal/=np.linalg.norm(normal,axis=2,keepdims=True)
    norm=texture(m,image(kind+' tangent normal',normal*.5+.5,True))
    node=m.node_tree.nodes.new('ShaderNodeNormalMap');node.uv_map='UVMap'
    node.inputs['Strength'].default_value={'wood':.7,'fabric':.6,'ceramic':.5,'soil':.7,'enamel':.3}.get(kind,.35)
    m.node_tree.links.new(norm.outputs['Color'],node.inputs['Color'])
    m.node_tree.links.new(node.outputs['Normal'],bsdf.inputs['Normal'])
    # Different resolution from the AO atlas keeps its UV set separate in glTF.
    values=np.clip(roughness+fine[::2,::2]*.08+broad[::2,::2]*.07,.15,1)
    rough=texture(m,image(kind+str(roughness)+' roughness',np.repeat(values[:,:,None],3,axis=2),True))
    m.node_tree.links.new(rough.outputs['Color'],bsdf.inputs['Roughness'])
    return m


def bake_static_occlusion(root):
    objects=[o for o in root.children_recursive if o.type=='MESH']
    for o in objects:
        if not o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
        o.data.uv_layers[0].name='UVMap'
        o.data.uv_layers.new(name='AOMap')
        o.data.uv_layers.active_index=1
        o.data.uv_layers[0].active_render=True
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.008,area_weight=.5)
    bpy.ops.object.mode_set(mode='OBJECT')
    size=1024
    atlas=bpy.data.images.new('Bedroom static occlusion',width=size,height=size,alpha=False)
    atlas.colorspace_settings.name='Non-Color'
    atlas.pixels.foreach_set(np.ones(size*size*4,dtype=np.float32))
    settings=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree')
    settings.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
    for m in {m for o in objects for m in o.data.materials}:
        ao=texture(m,atlas,'AOMap');m.node_tree.nodes.active=ao
        output=m.node_tree.nodes.new('ShaderNodeGroup');output.node_tree=settings
        m.node_tree.links.new(ao.outputs['Color'],output.inputs['Occlusion'])
    def movable(o):
        p=o
        while p:
            if p.name in ('watering_can','plant_rest','curtain_left','curtain_right','window_backdrop'):
                return True
            p=p.parent
        return any(m.name=='Window glass' for m in o.data.materials)
    excluded=[o for o in objects if movable(o)]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.hide_render=o in excluded
        o.select_set(o not in excluded)
    bpy.context.view_layer.objects.active=next(o for o in objects if o not in excluded)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48
    scene.render.bake.margin=8;scene.render.bake.use_clear=False
    bpy.ops.object.bake(type='AO',uv_layer='AOMap')
    for o in excluded:o.hide_render=False
    for o in objects:o.data.uv_layers.active_index=0
    atlas.pack()
    print('BEDROOM_STATIC_AO_OK')
