"""Validate the authored room using only the Python standard library."""
import hashlib
import json
import math
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
ROOTS = ('bedroom', 'room_shell', 'desk', 'plant_pot', 'plant_rest',
         'watering_can', 'curtain_left', 'curtain_right')
ANCHORS = ('window_anchor', 'room_target', 'desk_target', 'pot_target')


def unpack(data):
    magic, version, length = struct.unpack_from('<III', data)
    assert magic == 0x46546C67 and version == 2 and length == len(data)
    size, kind = struct.unpack_from('<II', data, 12)
    assert kind == 0x4E4F534A
    return json.loads(data[20:20 + size])


def validate(path):
    data = path.read_bytes()
    doc = unpack(data)
    nodes = doc['nodes']
    by_name = {}
    for i, node in enumerate(nodes):
        by_name.setdefault(node.get('name', ''), []).append(i)
        for key in ('translation', 'rotation', 'scale', 'matrix'):
            assert all(math.isfinite(x) for x in node.get(key, [])), (i, key)
        assert all(abs(x) > 1e-8 for x in node.get('scale', [1, 1, 1]))
        assert 'camera' not in node and 'KHR_lights_punctual' not in node.get('extensions', {})
    for name in ROOTS + ANCHORS:
        assert len(by_name.get(name, [])) == 1, f'Expected one {name}'

    def descendants(i):
        result = {i}
        for child in nodes[i].get('children', []):
            assert child not in result, 'Invalid hierarchy'
            result.update(descendants(child))
        return result

    all_room = descendants(by_name['bedroom'][0])
    for name in ROOTS + ANCHORS:
        i = by_name[name][0]
        assert i in all_room
        if name in ANCHORS:
            assert 'mesh' not in nodes[i] and not nodes[i].get('children'), name
            for moving in ('curtain_left', 'curtain_right', 'watering_can', 'plant_rest'):
                assert i not in descendants(by_name[moving][0]), name
        else:
            assert any('mesh' in nodes[j] for j in descendants(i)), name
    triangles = primitives = 0
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            assert primitive.get('mode', 4) == 4, 'Expected triangles'
            accessor = primitive.get('indices', primitive['attributes']['POSITION'])
            count = doc['accessors'][accessor]['count']
            assert count > 0 and count % 3 == 0
            triangles += count // 3
            primitives += 1
    assert len(data) <= 6_000_000, len(data)
    assert triangles <= 60_000, triangles
    assert primitives <= 50, primitives
    assert all('uri' not in x for x in doc.get('buffers', []) + doc.get('images', []))
    # Focal surfaces must retain their relief, roughness and baked depth in GLB.
    for material in doc['materials']:
        if material.get('name') in ('Honey oak', 'Pale floor oak', 'Ivory cotton',
                                    'Dusty rose quilt', 'Hand thrown clay', 'Sage enamel'):
            assert material.get('normalTexture'), material['name'] + ': missing normal texture'
            assert material.get('pbrMetallicRoughness', {}).get('metallicRoughnessTexture'), material['name'] + ': missing roughness'
            assert material.get('occlusionTexture'), material['name'] + ': missing ambient occlusion'
    result = {'bytes': len(data), 'triangles': triangles, 'primitives': primitives,
              'materials': len(doc.get('materials', [])), 'images': len(doc.get('images', [])),
              'sha256': hashlib.sha256(data).hexdigest()}
    print(json.dumps(result, indent=2))
    return result


if __name__ == '__main__':
    validate(ROOT / 'public/models/bedroom.glb')
