import tw, { css } from 'twin.macro';

import { useNavigate } from 'react-router-dom'

import { Button } from 'primereact/button'
import { Card } from 'primereact/card';
import { Chips } from 'primereact/chips';

import { atom, useAtom, useSetAtom } from 'jotai';
import { setupRoute } from 'renderer/helpers/route';
import ElectronIPC from 'renderer/electron_ipc';
import { createStoreAtom } from 'renderer/helpers';
import FoundFilesTable, { filesAtom } from './FoundFilesTable';
import classNames from 'classnames';
import { Accordion, AccordionTab } from 'primereact/accordion';

export const knobAtom = atom(0)

export const pathAtom = createStoreAtom<string>('root_path', "")
export const extsAtom = createStoreAtom<string[]>('exts', [])
export const ignoreAtom = createStoreAtom<string[]>('ignore', [])
export const runningAtom = atom<boolean>(false)

export const HomeLayout = () => {
  const navigate = useNavigate()
  const [chips, setChips] = useAtom(extsAtom)
  const [ignore, setIgnore] = useAtom(ignoreAtom)
  const [test, setTest] = useAtom(pathAtom)
  const [running, setRunning] = useAtom(runningAtom)
  const setFiles = useSetAtom(filesAtom)

  const handleChangePath = async () => {
    const res = await ElectronIPC.selectDir({})
    if (!res || res.canceled) return
    console.log(res)
    setTest(res.filePaths[0])
  }
  const handleToggleExplorer = async () => {
    if (!running) {
      setFiles([])
      const res = await window.electron.ipcRenderer.sendMessage('explorer-control', 'start')
      console.log(res)
      setRunning(true)
    } else {
      const res = await window.electron.ipcRenderer.sendMessage('explorer-control', 'stop')
      console.log(res)
      setRunning(false)
    }
  }

  return (
    <div className=" p-2 flex flex-column gap-3 h-screen overflow-y-auto ">
      <div className=" flex justify-content-between ">
        <div tw=" text-yellow-400 text-2xl font-semibold mx-1 flex gap-2">
          <span>
            Explorador
          </span>
          <Button
            className={classNames(" p-button-sm py-0 px-2 ", {
              ' p-button-warning ': running
            })}
            label={running ? "Detener Búsqueda" : "Iniciar Búsqueda"}
            icon={`pi ${running ? " pi-pause " : " pi-play "}`}
            onClick={handleToggleExplorer}
          />
          <span className="text-gray-200 font-normal ">{test}</span>
        </div>
        <div className="h-full flex gap-2 ">
          <Button
            label="Cambiar directorio raiz"
            icon=" pi pi-home "
            className=" p-button-primary p-button-sm self-align-right py-1 px-2 "
            onClick={handleChangePath}
          />
          <Button
            label="Test"
            icon=" pi pi-cog "
            className=" p-button-info p-button-sm self-align-right py-1 px-2 "
            onClick={() => navigate('/test')}
          />
        </div>
      </div>

      <div className=" flex gap-3 py-0 my-0 ">
        {/*
          <div className=" flex flex-column gap-1 w-3 ">
          </div>

          <div className=" w-3 flex items-center justify-center ">

          </div>
        */}


        <div
          className=" w-12 "
          css={css`
              .p-chips-multiple-container {
                ${tw` w-full `}
              }
              .exts-chips .p-chips-token-label{
                ${tw` text-green-300 `}
              }
              .ignore-chips .p-chips-token-label{
                ${tw` text-yellow-300 `}
              }
              .p-chips-token-icon {
                ${tw` text-red-400 `}
              }
            `}
        >
          <Accordion multiple className="accordion-custom">
            <AccordionTab
              header={<><i className="pi pi-cog"></i><span> Configuración</span></>}
            >
              <div>
                <h4 className="text-green-500 mb-1 mt-0 leading-none "> Extensiones</h4>
                <Chips
                  className=" min-w-full exts-chips "
                  value={chips || []}
                  onChange={(e) => setChips(e.value)}
                ></Chips>
              </div>
              <div>
                <h4 className="text-yellow-500 mb-1 mt-1 leading-none "> Omitir <span tw="text-gray-500">(regex)</span></h4>
                <Chips
                  className=" min-w-full ignore-chips "
                  value={ignore || []}
                  onChange={(e) => setIgnore(e.value)}
                ></Chips>
              </div>
            </AccordionTab>
          </Accordion>
        </div>
      </div>

      <FoundFilesTable />

    </div>
  );
};

export const HomeRoute = setupRoute('/', HomeLayout)
