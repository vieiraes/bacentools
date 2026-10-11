import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { ToolIcon } from '@/components/ToolIcon';
import type { Tool } from '@/lib/tools';

export function PageHeader({ tool, children }: { tool: Tool; children?: React.ReactNode }) {
  return (
    <Box component="header" sx={{ mb: 3 }}>
      <Typography variant="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ToolIcon icon={tool.icon} color="primary" fontSize="large" />
        {tool.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, maxWidth: '75ch' }}>{tool.description}</Typography>
      {children}
    </Box>
  );
}
