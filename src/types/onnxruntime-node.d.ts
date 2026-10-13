// Le paquet onnxruntime-node (tests seulement) n'embarque pas ses types : ce sont ceux d'onnxruntime-common.
declare module 'onnxruntime-node' {
  export * from 'onnxruntime-common'
}
