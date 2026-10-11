import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PixIcon from '@mui/icons-material/Pix';
import DescriptionIcon from '@mui/icons-material/Description';
import OpacityIcon from '@mui/icons-material/Opacity';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LinkIcon from '@mui/icons-material/Link';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { Tool } from '@/lib/tools';

const ICONS = { bank: AccountBalanceIcon, pix: PixIcon, docs: DescriptionIcon, bucket: OpacityIcon, flow: AltRouteIcon, qr: QrCodeScannerIcon, qrAdd: QrCode2Icon, id: FingerprintIcon, link: LinkIcon };

export function ToolIcon({ icon, ...props }: { icon: Tool['icon'] } & SvgIconProps) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden {...props} />;
}
