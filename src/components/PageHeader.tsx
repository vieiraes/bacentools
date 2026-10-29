import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { JsonLd } from '@/components/JsonLd';
import { ToolIcon } from '@/components/ToolIcon';
import { jsonLdFerramenta } from '@/lib/seo';
import type { Tool } from '@/lib/tools';

export function PageHeader({ tool, children }: { tool: Tool; children?: React.ReactNode }) {
  return (
    <Box component="header" sx={{ mb: 3 }}>
      <JsonLd data={jsonLdFerramenta(tool)} />
      <Typography variant="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ToolIcon icon={tool.icon} color="primary" fontSize="large" />
        {tool.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, maxWidth: '75ch' }}>{tool.description}</Typography>
      {children}
    </Box>
  );
}
