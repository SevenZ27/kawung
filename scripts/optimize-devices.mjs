import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, prune, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import { stat, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
await MeshoptEncoder.ready
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder})
const results=[]
for(const id of ['studio-display','iphone']){
 const path=`qa/assets/converted-local-only/${id}.glb`,before=(await stat(path)).size
 const doc=await io.read(path)
 await doc.transform(dedup(),weld(),prune(),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeTexcoord:16,quantizeNormal:12}))
 await io.write(path,doc)
 const bytes=await readFile(path)
 results.push({id,before,after:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})
}
await writeFile('docs/verification/device-models.json',JSON.stringify(results,null,2))
console.log(results)
