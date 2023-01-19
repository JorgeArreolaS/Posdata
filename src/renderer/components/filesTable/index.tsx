import { css } from "@emotion/react";
import { Button } from "primereact/button";
import { Calendar } from 'primereact/calendar';
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useElectron } from "renderer/electron_ipc";
import { useState } from "react";

const FilesTable: React.FC<{}> = ({ }) => {

  const [test, callTest] = useElectron.getDir({
    initial: () => {
      return { path: ['/Users/jorgearreola'] }
    }
  })

  const header = (
     <div className="flex justify-content-between align-items-center">
                <h5 className="m-0">Revisión</h5>
            </div>
  );
  const footer = `In total there are ${test?.items ? test?.items?.length : 0} products.`;

  const formatDate = (value) => {
    return new Date(value).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const actionColumn = (options: any) => {
    return <div className=" flex gap-2 ">
      <Button className="p-button-sm p-button-success" icon=" pi pi-check "></Button>
      <Button className="p-button-sm p-button-danger" icon=" pi pi-trash "></Button>
    </div>
  }
  const dirCol = (options: any) => {
    return <span>{options.dir}</span>
  }
  const modifiedColumn = (options: any) => formatDate(options.mtime)
  const createdColumn = (options: any) => formatDate(options.ctime)

  return <div
    css={css`
td {
    padding: 0.2rem 0.5rem;
}
`}
  >
    {test?.items &&
      <DataTable
        value={test.items}
        header={header}
        footer={footer}
        size="small"
        paginator
        rows={10}
      >
        <Column
          field="base"
          header="Nombre"
          sortable
        />
        <Column
          field="dir"
          header="Directorio"
          body={dirCol}
          sortable
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
          headerStyle={{ width: '4rem', textAlign: 'center' }}
          bodyStyle={{ textAlign: 'center', overflow: 'visible' }}
          body={actionColumn}
        />
      </DataTable>
    }
  </div>

}

export default FilesTable
