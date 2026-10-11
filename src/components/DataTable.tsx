'use client';

import { DataGrid, type DataGridProps, type GridValidRowModel } from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';

/** DataGrid com o padrão do site: compacto, paginado de 25 em 25 e em português. */
export default function DataTable<R extends GridValidRowModel>(props: DataGridProps<R>) {
  return (
    <DataGrid<R>
      autoHeight
      density="compact"
      disableRowSelectionOnClick
      pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
      localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
      {...props}
    />
  );
}
