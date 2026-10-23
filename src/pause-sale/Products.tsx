import React from 'react';
import {PAUSE_SALE} from './config';

export type ProductKind = 'syringe' | 'vial';

/** These exact outer paths are shared by the glass objects and their targets. */
export const PRODUCT_SILHOUETTES: Record<ProductKind, string> = {
  syringe:
    'M126 57 H234 Q240 57 240 63 V76 Q240 82 234 82 H190 V194 H248 Q255 194 255 201 V207 Q255 214 248 214 H223 V598 Q223 615 206 627 L196 635 V677 Q196 686 187 689 L182 700 V827 L178 842 V700 L173 689 Q164 686 164 677 V635 L154 627 Q137 615 137 598 V214 H112 Q105 214 105 207 V201 Q105 194 112 194 H170 V82 H126 Q120 82 120 76 V63 Q120 57 126 57 Z',
  vial:
    'M120 205 H240 Q250 205 250 215 V259 Q250 266 240 266 H231 V295 Q231 307 246 315 L270 330 Q295 347 295 376 V665 Q295 698 263 700 H97 Q65 698 65 665 V376 Q65 347 90 330 L114 315 Q129 307 129 295 V266 H120 Q110 266 110 259 V215 Q110 205 120 205 Z',
};

const Syringe: React.FC<{p: string}> = ({p}) => (
  <>
    <defs>
      <linearGradient id={`${p}-glass`} x1="137" y1="0" x2="223" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#C6C7BF" stopOpacity=".66" />
        <stop offset=".06" stopColor="#FFFFFF" stopOpacity=".96" />
        <stop offset=".15" stopColor="#FFFFFF" stopOpacity=".3" />
        <stop offset=".48" stopColor="#FFFFFF" stopOpacity=".68" />
        <stop offset=".8" stopColor="#C8CFC8" stopOpacity=".2" />
        <stop offset=".95" stopColor="#B7BEB4" stopOpacity=".7" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity=".85" />
      </linearGradient>
      <linearGradient id={`${p}-gold`} x1="110" y1="0" x2="255" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8F7757" />
        <stop offset=".16" stopColor="#DFC9A5" />
        <stop offset=".31" stopColor="#FAEED6" />
        <stop offset=".53" stopColor={PAUSE_SALE.colors.gold} />
        <stop offset=".8" stopColor="#AC8E64" />
        <stop offset=".94" stopColor="#E7D6BA" />
        <stop offset="1" stopColor="#A48A65" />
      </linearGradient>
      <linearGradient id={`${p}-steel`}>
        <stop stopColor="#737B79" />
        <stop offset=".25" stopColor="#E4E9E5" />
        <stop offset=".5" stopColor="#FFFFFF" />
        <stop offset=".72" stopColor="#A9B1AD" />
        <stop offset="1" stopColor="#59625F" />
      </linearGradient>
      <linearGradient id={`${p}-liquid`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#F5F4DD" stopOpacity=".15" />
        <stop offset="1" stopColor="#D2DCCC" stopOpacity=".48" />
      </linearGradient>
      <linearGradient id={`${p}-white`}>
        <stop stopColor="#C9CBC3" />
        <stop offset=".15" stopColor="#FFFFFF" />
        <stop offset=".5" stopColor="#FCFCF8" />
        <stop offset=".95" stopColor="#CACDC3" />
        <stop offset="1" stopColor="#F7F8F1" />
      </linearGradient>
      <filter id={`${p}-shadow`} x="-80%" y="-10%" width="260%" height="135%">
        <feDropShadow dx="9" dy="15" stdDeviation="11" floodColor="#5C4B36" floodOpacity=".14" />
      </filter>
      <clipPath id={`${p}-clip`}><path d={PRODUCT_SILHOUETTES.syringe} /></clipPath>
    </defs>
    <g filter={`url(#${p}-shadow)`}>
      <path d={PRODUCT_SILHOUETTES.syringe} fill={`url(#${p}-glass)`} />
      <g clipPath={`url(#${p}-clip)`}>
        <rect x="120" y="57" width="120" height="25" rx="6" fill={`url(#${p}-gold)`} />
        <path d="M125 60 H235" stroke="#FFF7E6" strokeWidth="1.5" opacity=".8" />
        <rect x="170" y="82" width="20" height="227" fill={`url(#${p}-white)`} />
        <path d="M174 86 V279" stroke="white" strokeWidth="3" opacity=".75" />
        <rect x="143" y="281" width="74" height="27" rx="5" fill="#565E59" />
        <rect x="143" y="285" width="74" height="4" fill="#A5AAA3" />
        <rect x="143" y="302" width="74" height="3" fill="#363D39" />
        <path d="M141 310 H219 V599 Q218 613 204 622 L192 632 H168 L156 622 Q142 613 141 599 Z" fill={`url(#${p}-liquid)`} />
        <ellipse cx="180" cy="310" rx="38" ry="4" fill="#F9FAEE" opacity=".7" />
        <path d="M143 219 V590 Q143 605 157 617" stroke="#FFFFFF" strokeWidth="4" opacity=".8" fill="none" />
        <path d="M150 221 V587" stroke="#FFFFFF" strokeWidth="1.5" opacity=".65" />
        <path d="M217 221 V595 Q217 610 203 620" stroke="#A7B1A7" strokeWidth="1.5" opacity=".4" fill="none" />
        {Array.from({length: 23}, (_, i) => {
          const y = 336 + i * 10.5;
          return <g key={i} opacity=".65">
            <path d={`M${i % 5 === 0 ? 190 : 201} ${y} H214`} stroke="#56615B" strokeWidth={i % 5 === 0 ? 1.7 : 1} />
            {i % 5 === 0 && <text x="187" y={y + 3} textAnchor="end" fontFamily="Arial,sans-serif" fontSize="8" fill="#4E5953">{(1 - i / 30).toFixed(1)}</text>}
          </g>;
        })}
        <text x="160" y="487" transform="rotate(-90 160 487)" fontFamily="Arial,sans-serif" fontSize="8" letterSpacing="2.2" fill="#798379" opacity=".7">PRECISION</text>
        <path d="M108 196 H252 V212 H108 Z" fill={`url(#${p}-white)`} />
        <path d="M113 197 H247" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M112 211 H248" stroke="#B9BFB5" strokeWidth="1" />
        <path d="M165 635 H195 V680 Q194 688 180 691 Q166 688 165 680 Z" fill={`url(#${p}-gold)`} />
        <path d="M169 640 V676 M175 640 V678 M188 640 V678" stroke="#F1E2C6" strokeWidth="1.3" opacity=".7" />
        <path d="M173 688 H187 L182 701 H178 Z" fill={`url(#${p}-steel)`} />
        <path d="M178 699 H182 V827 L178 842 Z" fill={`url(#${p}-steel)`} />
        <path d="M179.1 704 V827" stroke="#FFFFFF" strokeWidth=".65" opacity=".9" />
      </g>
      <path d={PRODUCT_SILHOUETTES.syringe} fill="none" stroke="#8A9588" strokeOpacity=".3" strokeWidth=".7" />
    </g>
  </>
);

const Vial: React.FC<{p: string}> = ({p}) => (
  <>
    <defs>
      <linearGradient id={`${p}-vglass`} x1="65" y1="0" x2="295" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8F9B8D" stopOpacity=".45" />
        <stop offset=".035" stopColor="#FFFFFF" stopOpacity=".9" />
        <stop offset=".13" stopColor="#E6EBDF" stopOpacity=".3" />
        <stop offset=".3" stopColor="#FFFFFF" stopOpacity=".8" />
        <stop offset=".52" stopColor="#FFFFFF" stopOpacity=".16" />
        <stop offset=".82" stopColor="#C6D2C1" stopOpacity=".32" />
        <stop offset=".95" stopColor="#8A9A85" stopOpacity=".5" />
        <stop offset="1" stopColor="#F8FCF4" stopOpacity=".9" />
      </linearGradient>
      <linearGradient id={`${p}-vgold`}>
        <stop stopColor="#86714E" />
        <stop offset=".15" stopColor="#CAB18A" />
        <stop offset=".3" stopColor="#F4E6CB" />
        <stop offset=".5" stopColor={PAUSE_SALE.colors.gold} />
        <stop offset=".75" stopColor="#A88A5B" />
        <stop offset=".9" stopColor="#DCCAAD" />
        <stop offset="1" stopColor="#8F7651" />
      </linearGradient>
      <linearGradient id={`${p}-vlabel`}>
        <stop stopColor="#D9D0BF" />
        <stop offset=".12" stopColor="#F9F6EE" />
        <stop offset=".45" stopColor="#FFFDF7" />
        <stop offset=".85" stopColor="#F4F0E5" />
        <stop offset="1" stopColor="#D7CFBE" />
      </linearGradient>
      <radialGradient id={`${p}-cap`} cx="40%" cy="25%" r="80%">
        <stop stopColor="#FFFFFF" />
        <stop offset=".6" stopColor="#F9F7F0" />
        <stop offset="1" stopColor="#B9BAAD" />
      </radialGradient>
      <filter id={`${p}-vshadow`} x="-50%" y="-30%" width="220%" height="180%">
        <feDropShadow dx="10" dy="20" stdDeviation="13" floodColor="#5C4B36" floodOpacity=".16" />
      </filter>
      <clipPath id={`${p}-vclip`}><path d={PRODUCT_SILHOUETTES.vial} /></clipPath>
    </defs>
    <g filter={`url(#${p}-vshadow)`}>
      <path d={PRODUCT_SILHOUETTES.vial} fill={`url(#${p}-vglass)`} />
      <g clipPath={`url(#${p}-vclip)`}>
        <path d="M74 614 H286 V662 Q286 691 259 692 H100 Q74 691 74 662 Z" fill="#DFE6D6" opacity=".32" />
        <ellipse cx="180" cy="615" rx="106" ry="7" fill="#FFFFFF" opacity=".3" />
        <path d="M131 270 H229 V298 Q229 315 247 325 L268 338 Q284 349 286 370" stroke="#FDFEF9" strokeWidth="5" opacity=".65" fill="none" />
        <path d="M143 276 H217 V299 Q217 309 226 317" stroke="#A8B69F" strokeWidth="1.6" opacity=".5" fill="none" />
        <path d="M89 355 Q79 369 79 389 V653 Q79 674 91 680" stroke="white" strokeWidth="6" opacity=".7" fill="none" />
        <path d="M98 347 Q87 365 87 389 V649" stroke="white" strokeWidth="2" opacity=".65" fill="none" />
        <path d="M280 382 V652 Q280 680 259 684" stroke="#EEF5E9" strokeWidth="3" opacity=".7" fill="none" />
        <path d="M99 685 Q180 701 261 685" stroke="#A8B79D" strokeWidth="2" opacity=".45" fill="none" />
        <path d="M69 399 Q180 387 291 399 V609 Q180 621 69 609 Z" fill={`url(#${p}-vlabel)`} />
        <path d="M70 406 Q180 395 290 406" stroke={PAUSE_SALE.colors.gold} strokeWidth="1.7" />
        <path d="M70 600 Q180 611 290 600" stroke={PAUSE_SALE.colors.gold} strokeWidth="1.7" />
        <text x="180" y="471" textAnchor="middle" fontFamily="Georgia,serif" fontSize="49" letterSpacing="-5" fill="#20211E">NN</text>
        <path d="M151 487 H209" stroke={PAUSE_SALE.colors.gold} strokeWidth="1.1" />
        <text x="180" y="511" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="13.5" letterSpacing="3.1" fill="#252821">BOTULINUM</text>
        <text x="180" y="536" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="3.2" fill="#606458">AESTHETICS</text>
        <text x="180" y="575" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="9" letterSpacing="2.5" fill="#77796B">TYPE A</text>
        <path d="M110 205 H250 V265 H110 Z" fill={`url(#${p}-vgold)`} />
        {Array.from({length: 18}, (_, i) => <path key={i} d={`M${115 + i * 7.5} 224 V254`} stroke={i < 7 ? '#FAEDD5' : '#7F694B'} strokeOpacity=".3" strokeWidth="1.1" />)}
        <path d="M112 257 H248" stroke="#8A7350" strokeWidth="2" opacity=".6" />
        <path d="M114 218 H246" stroke="#F9EFD9" strokeWidth="1" opacity=".8" />
        <rect x="118" y="204" width="124" height="19" rx="7" fill={`url(#${p}-cap)`} />
        <path d="M127 208 H232" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity=".8" />
        <path d="M113 262 H247" stroke="#EDDCC0" strokeWidth="1" opacity=".8" />
      </g>
      <path d={PRODUCT_SILHOUETTES.vial} fill="none" stroke="#8B9882" strokeOpacity=".38" strokeWidth=".8" />
    </g>
  </>
);

export const Product: React.FC<{kind: ProductKind; outline?: boolean; id?: string}> = ({kind, outline = false, id = 'product'}) => {
  const p = `${id}-${kind}`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="900" viewBox="0 0 360 900" style={{overflow: 'visible', display: 'block'}}>
      {outline
        ? <path d={PRODUCT_SILHOUETTES[kind]} fill="none" stroke={PAUSE_SALE.colors.gold} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
        : kind === 'syringe' ? <Syringe p={p} /> : <Vial p={p} />}
    </svg>
  );
};
