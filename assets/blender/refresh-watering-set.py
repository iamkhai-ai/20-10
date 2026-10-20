"""Refresh only the can and pot finishes in the saved bedroom, preserving the room.

Blender --background --python assets/blender/refresh-watering-set.py
The full create-bedroom.py uses the same can builder and material settings.
"""
from pathlib import Path
import sys
import bpy
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent))
from bedroom_surfaces import surface, texture, glaze_finish
from watering_can import build_watering_can

ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path(__file__).with_name('bedroom.blend')
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
can=bpy.data.objects['watering_can'];root=bpy.data.objects['bedroom']
for child in list(can.children_recursive):bpy.data.objects.remove(child,do_unlink=True)

def replace_material(name,color,rough,kind):
    old=bpy.data.materials.get(name)
    if old:old.name=name+' prior'
    material=surface(name,color,rough,kind)
    if old:
        old.user_remap(material);bpy.data.materials.remove(old)
    material.name=name
    # Dynamic props sample the existing AO atlas through UV1, never rebake the room.
    atlas=bpy.data.images['Bedroom static occlusion']
    ao=texture(material,atlas,'AOMap')
    group=material.node_tree.nodes.new('ShaderNodeGroup');group.node_tree=bpy.data.node_groups['glTF Material Output']
    material.node_tree.links.new(ao.outputs['Color'],group.inputs['Occlusion'])
    return material

blush=glaze_finish(replace_material('Sage enamel',(.92,.87,.76),.28,'enamel'),coat=.25)
pot=glaze_finish(replace_material('Hand thrown clay',(.90,.945,.94),.20,'plaster'),transmission=.10,coat=.65)
cream=bpy.data.materials['Cream glazed rim']
cream.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.94,.965,.94,1)
cream.diffuse_color=(.94,.965,.94,1)
cream.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.22
glaze_finish(cream)
build_watering_can(can,blush,cream,bpy.data.materials['Soft aged brass'],bpy.data.materials['Quiet shadow'])

# Merge only the new can by material, matching the full source export contract.
buckets={}
for obj in list(can.children):buckets.setdefault(obj.data.materials[0].name,[]).append(obj)
for name,objects in buckets.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
    bpy.context.object.name='watering_can / '+name

# The movable can intentionally has white static occlusion. Find a white 8x8
# atlas patch, then use its center for all AO UVs; other room UVs stay untouched.
atlas=bpy.data.images['Bedroom static occlusion'];w,h=atlas.size
pixels=np.array(atlas.pixels[:],dtype=np.float32).reshape(h,w,4)
white=None
for y in range(4,h-4,8):
    for x in range(4,w-4,8):
        if np.min(pixels[y-4:y+4,x-4:x+4,:3])>.999:
            white=((x+.5)/w,(y+.5)/h);break
    if white:break
if white is None:raise RuntimeError('No white AO patch found; preserve the original asset.')
for obj in can.children:
    uv=obj.data.uv_layers.get('AOMap') or obj.data.uv_layers.new(name='AOMap')
    for loop in uv.data:loop.uv=white
    obj.data.uv_layers.active_index=0

bpy.ops.object.select_all(action='DESELECT')
for obj in [root]+list(root.children_recursive):obj.select_set(True)
bpy.context.view_layer.objects.active=root
OUT=ROOT/'public/models/bedroom.glb'
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_yup=True,
    export_apply=True,export_cameras=False,export_lights=False,export_animations=False)
for image in list(bpy.data.images):
    if image.users==0:bpy.data.images.remove(image)
for data in list(bpy.data.meshes):
    if data.users==0:bpy.data.meshes.remove(data)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
print('WATERING_SET_REFRESH_OK',OUT,OUT.stat().st_size)
