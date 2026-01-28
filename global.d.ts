declare module 'qrcode.react' {
  import { FC } from 'react';
  
  export interface QRCodeSVGProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
  }
  
  export const QRCodeSVG: FC<QRCodeSVGProps>;
}
