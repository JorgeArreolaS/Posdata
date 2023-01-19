import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import type { FileType } from "main/handlers"
import { useEffect } from "react"
import { pathAtom, runningAtom } from "."

export const filesAtom = atom<FileType[]>([])
const filesCountAtom = atom<number>( (get) => get(filesAtom).length )
export const currentFileAtom = atom<string>("")

const FoundFilesTable: React.FC<{}> = ({ }) => {
  const setRunning = useSetAtom(runningAtom)
  const setFiles = useSetAtom(filesAtom)
  const setFile = useSetAtom(currentFileAtom)
  const toast = useToast()

  useEffect(() => {
    const kill = [
      window.electron.ipcRenderer.on("file-found", (data: any) => {
        setFiles(prev => [data, ...prev])
      }),
      window.electron.ipcRenderer.on("current-file", (data: any) => {
        setFile(data)
      }),
      window.electron.ipcRenderer.on("explorer-ended", (_data: any) => {
        toast?.show({
          severity: "success",
          summary: 'Exploración finalizada',
        })
        setFile("")
        setRunning(false)
      }),
    ]
    return () => {
      kill.forEach(k => k())
    }
  }
    , [])

  return <div css={css`
::-webkit-scrollbar {
  width: 3px;               /* width of the entire scrollbar */
}

`}>
    <FilesTable />
  </div>

}

export default FoundFilesTable

import { css } from "@emotion/react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useToast } from "renderer/hooks"
import { useDebounce } from "use-debounce"
import ElectronIPC from "renderer/electron_ipc"

const FilesTable: React.FC<{}> = ({ }) => {
  const path = useAtomValue(pathAtom)
  const running = useAtomValue(runningAtom)
  const [files, setFiles] = useAtom(filesAtom)
  const [totalSize] = useDebounce(files.length > 0 && files.map(i => i.size).reduce((a, b) => a + b), 1000)
  const toast = useToast()

  const handleDelete = async (data: FileType, { promptSuccess }: { promptSuccess?: boolean } = { promptSuccess: false }): Promise<boolean> => {
    const res = await ElectronIPC.deleteFile({ path: data.path })
    if (res.error) {
      toast?.show({
        severity: "error",
        summary: 'Error eliminando archivo',
        detail: res.error?.message
      })
      return false
    }
    if (promptSuccess) {
      toast?.show({
        severity: "success",
        summary: 'Archivo eliminado',
        detail: data.path
      })
    }
    setFiles(files => files.filter(i => i.path !== data.path))
    return true
  }

  const deleteAll = async () => {

    let count = 0
    for (let file of files) {
      const res = await handleDelete(file)
      if (res)
        count++
    }

    toast?.show({
      severity: "success",
      summary: 'Eliminación completeda',
      detail: `${count} archivos removidos permanentemente` 
    })
  }

  const round = (n: number, d: number = 2) => Math.round(n * 10 ** d) / 10 ** d

  const sizeFormat = (size: number): [number, string] => {
    if (Math.log10(size) > 9) return [round(size / 10 ** 9), 'GB']
    if (Math.log10(size) > 6) return [round(size / 10 ** 6), 'MB']
    if (Math.log10(size) > 3) return [round(size / 10 ** 3), 'KB']
    return [size, 'B']
  }

  const sizeColumn = (options: any) => {
    const [size, unit] = sizeFormat(options.size)
    return <div tw=" flex gap-1 ">
      <span>{size}</span>
      <span tw=" text-gray-400 ml-auto ">{unit}</span>
    </div>
  }
  const currentFile = useAtomValue(currentFileAtom)

  const header = (
    <div className="flex align-items-center gap-3 ">
      <h5 className="m-0">{files.length} archivos encontrados</h5>
      <div tw=" flex-grow whitespace-nowrap ">
        {running && <h2 tw=" whitespace-nowrap ">{currentFile}</h2>}
      </div>
      <div className=" flex gap-2 items-center justif-center ">
        {!!totalSize && <h3 tw=" flex gap-2 ">Total: {sizeColumn({ size: totalSize })}</h3>}
        {files.length > 0 &&
          <Button
            className=" p-button-sm p-button-danger py-1 px-2 "
            label="Borrar todo"
            icon=" pi pi-trash "
            onClick={deleteAll}
          ></Button>
        }
      </div>
    </div>
  );

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }


  const handleOK = async (data: FileType) => {
    setFiles(files => files.filter(i => i.path !== data.path))
  }

  const actionColumn = (_options: any) => {
    return <div className=" flex gap-2 ">
      <Button className="p-button-sm p-button-success" icon=" pi pi-check " onClick={() => handleOK(_options)}></Button>
      <Button
        className="p-button-sm p-button-danger"
        icon=" pi pi-trash "
        onClick={() => handleDelete(_options, { promptSuccess: true })}
      ></Button>
    </div>
  }
  const dirName = (options: any) => <span tw=" text-gray-200 cursor-pointer flex gap-2 " className=" group ">
    <Button
      icon=" pi pi-external-link "
      className=" p-button-sm p-0 text-sm h-5 w-auto "
      tw="transition-all opacity-0 hover:opacity-100 group-hover:opacity-80 -ml-5 group-hover:ml-0 "
      css={css` aspect-ratio: 1/1; `}
      onClick={() => {
        ElectronIPC.openFile([options.dir, options.base].join("/"))
      }}
    />
    {options.base}
  </span>
  const dirCol = (options: any) => <span
    tw=" text-gray-200 cursor-pointer flex gap-2 whitespace-nowrap "
    className=" group "
  >
    <Button
      icon=" pi pi-external-link "
      className=" p-button-sm p-0 text-sm h-5 w-auto "
      tw="transition-all opacity-0 hover:opacity-100 group-hover:opacity-80 -ml-5 group-hover:ml-0 "
      css={css` aspect-ratio: 1/1; `}
      onClick={() => {
        ElectronIPC.openDir([options.dir, options.base].join("/"))
      }}
    />
    {options.dir.replace(path, "") || '/'}
  </span>
  const modifiedColumn = (options: any) => formatDate(options.mtime)
  const createdColumn = (options: any) => formatDate(options.ctime)

  return <div
    css={css`
  td {
    padding: 0.2rem 0.5rem !important;
    &::-webkit-scrollbar {
    width: 2px;               /* width of the entire scrollbar */
      height: 2px;
    }
  }
`}
  >
    {files &&
      <DataTable
        value={files}
        header={header}
        size="small"
        paginator
        rows={500}
        scrollable
        scrollHeight="600px"
        rowsPerPageOptions={[50, 100, 200, 500, 1000]}
      >
        <Column
          field="base"
          header="Nombre"
          body={dirName}
          sortable
        />
        <Column
          field="dir"
          header="Directorio"
          body={dirCol}
          sortable
          bodyStyle={{ overflowX: 'auto' }}
        />
        <Column
          field="ctime"
          header="Creado"
          body={createdColumn}
          sortable
        />
        <Column
          field="mtime"
          header="Modificado"
          body={modifiedColumn}
          sortable
        />
        <Column
          field="size"
          header="Tamaño"
          body={sizeColumn}
          sortable
        />
        <Column
          headerStyle={{ maxWidth: '6rem', textAlign: 'center' }}
          bodyStyle={{ maxWidth: '6rem', textAlign: 'center', overflow: 'visible' }}
          body={actionColumn}
        />
      </DataTable>
    }
  </div>

}
