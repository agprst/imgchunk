import { Component, createSignal } from "solid-js";
import clsx from 'clsx';
import { PngChunk, arrayBufferToBase64, listPngChunks, removePngChunk } from "./util";

const AncillaryChunks = Object.freeze(new Set([
  "cHRM",
  "gAMA",
  "sBIT",
  "sRGB",
  "bKGD",
  "hIST",
  "tRNS",
  "pHYs",
  "sPLT",
  "tIME",
  "eXIf",
  "iCCP",
  "iTXt",
  "tEXt",
  "zTXt",
]));

const App: Component = () => {
  let dropzoneRef: HTMLDivElement;
  const [pngChunks, setPngChunks] = createSignal<PngChunk[]>([]);
  const [arrayBuffer, setArrayBuffer] = createSignal<Uint8Array | null>(null);
  const [chunksToDelete, setChunksToDelete] = createSignal<string[]>([]);
  const [imgSrc, setImgSrc] = createSignal<string>('');

  const handleRemoveChunk = (chunkToDelete: PngChunk) => {
    if (!AncillaryChunks.has(chunkToDelete.type)) return;
    setChunksToDelete([...chunksToDelete(), chunkToDelete.type]);
    setPngChunks(pngChunks().filter((chunk) => chunk.type != chunkToDelete.type));
  }

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    if (!event.dataTransfer?.items.length) return;
    const fileHandlesPromise = event.dataTransfer.items[0];
    const item = await fileHandlesPromise;
    const file = item.getAsFile();
    if (file) readFile(file);
  }

  const handleFileSelect = (event: Event) => {
    event.preventDefault();
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) readFile(file);

  }

  const downloadFile = () => {
    const newArrayBuffer = removePngChunk(arrayBuffer()!, chunksToDelete());
    const blob = new Blob([newArrayBuffer], { type: 'image/png' });
    const blobURL = window.URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = blobURL;
    tempLink.setAttribute('download', 'result.png');
    tempLink.click();
  }

  const readFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const newArrayBuffer = reader.result as ArrayBuffer;
      const byteArray = new Uint8Array(newArrayBuffer);
      setPngChunks(listPngChunks(byteArray));
      setArrayBuffer(byteArray);

      const base64String = arrayBufferToBase64(byteArray);
      setImgSrc(`data:image/png;base64, ${base64String}`);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div class="flex items-center justify-center flex-col h-screen text-white font-bold bg-gray-800">
      <header class="m-10">
        <div class="text-5xl font-extrabold.">
          <span>PNG </span>
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            Chunk
          </span>
          <span> Remover</span>
        </div>
      </header>
      <div>
        {!arrayBuffer() && (
          <div
            ref={dropzoneRef!}
            class="flex items-center justify-center w-96"
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
            }}
          >
            <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <svg aria-hidden="true" class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to open a PNG file</span></p>
                <p class="text-xs text-gray-500 dark:text-gray-400">or drag and drop the file</p>
              </div>
              <input id="dropzone-file" type="file" class="hidden" accept=".png,image/png" onChange={handleFileSelect} />
            </label>
          </div>
        )}
        {arrayBuffer() && (
          <div class="flex flex-col">
            <div class="flex">
              <div class="border border-gray-300 rounded p-4 w-80 h-96 overflow-auto scrollbar-hide">
                <img alt="png" src={imgSrc()} />
              </div>
              <div class="border border-gray-300 rounded p-4 w-80 h-96 overflow-auto">
                <p id="hex-value" class="text-sm font-mono">
                  {pngChunks()?.length && pngChunks()?.map((chunk) => (
                    <div
                      class={clsx(
                        "mb-2",
                        AncillaryChunks.has(chunk.type)
                          ? "hover:bg-pink-800 cursor-pointer"
                          : "hover:bg-slate-500 cursor-not-allowed"
                      )}
                      onClick={() => handleRemoveChunk(chunk)}
                    >
                      <p>{`Type : ${chunk.type}`}</p>
                      <p>{`Length : ${chunk.length} Bytes`}</p>
                      <p>{`CRC : ${chunk.crc}`}</p>
                    </div>
                  ))}
                </p>
              </div>
            </div>
            <button
              onClick={downloadFile}
              class={clsx(
                "m-5 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 px-5 py-3 text-base font-medium text-white transition duration-200 hover:shadow-lg hover:shadow-[#6025F5]/50",
              )}
            >
              Download PNG
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
