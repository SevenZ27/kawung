// Restore the licensed local models, removing only visually identified logo meshes.
// Raw inputs are immutable. Outputs remain excluded from source control.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
})
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const arrayHash = accessor => accessor ? hash(Buffer.from(accessor.getArray().buffer, accessor.getArray().byteOffset, accessor.getArray().byteLength)) : null
const signature = node => ({
  matrix: node.getMatrix(),
  primitives: node.getMesh()?.listPrimitives().map(p => ({
    mode: p.getMode(), indices: arrayHash(p.getIndices()),
    attributes: Object.fromEntries(p.listSemantics().map(k => [k, arrayHash(p.getAttribute(k))])),
    material: p.getMaterial()?.getName(),
  })),
})
const report=[]
await mkdir('qa/assets/no-logo',{recursive:true})
for (const [id, logos] of [
  ['iphone', ['lOvBmzvFYioveSv','XSQLGTTQPOzWnxm']],
  ['studio-display', ['YrhTpmJzRMIDxdd']],
]) {
  const source=`qa/assets/converted-local-only/${id}.glb`
  const bytes=await readFile(source),doc=await io.readBinary(bytes)
  const nodes=doc.getRoot().listNodes()
  const before=Object.fromEntries(nodes.filter(n=>n.getMesh()&&!logos.includes(n.getName())).map(n=>[n.getName(),signature(n)]))
  for(const name of logos) {
    const node=nodes.find(n=>n.getName()===name)
    if(!node?.getMesh())throw new Error(`Missing verified logo mesh: ${id}/${name}`)
    node.dispose()
  }
  await doc.transform(prune())
  const output=await io.writeBinary(doc),checked=await io.readBinary(output)
  const after=Object.fromEntries(checked.getRoot().listNodes().filter(n=>n.getMesh()).map(n=>[n.getName(),signature(n)]))
  if(JSON.stringify(before)!==JSON.stringify(after))throw new Error(`Non-logo geometry changed: ${id}`)
  if(!after.WallpaperScreen)throw new Error(`Missing dynamic wallpaper screen: ${id}`)
  await writeFile(`qa/assets/no-logo/${id}.glb`,output)
  report.push({id,inputSha256:hash(bytes),outputSha256:hash(output),bytes:output.length,removedMeshes:logos,unchangedMeshes:Object.keys(before).length,nonLogoGeometryIdentical:true,screenGeometryIdentical:true})
}
await writeFile('docs/verification/device-logo-removal.json',JSON.stringify({date:'2026-10-21',scope:'Local licensed model restoration; no deployment',models:report},null,2)+'\n')
console.log(report)
