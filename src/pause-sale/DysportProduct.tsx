import React from 'react';
import {staticFile} from 'remotion';
import {PAUSE_SALE} from './config';

/**
 * Shared outer contour measured from the generated vial's alpha channel.
 * The product image is clipped by this exact path, and its target draws it.
 * Original generated PNG is preserved unmodified; the clip excludes matte debris.
 */
export const DYSPORT_SILHOUETTE = "M156.00 121.20 L103.80 124.80 L68.40 130.20 L60.00 132.60 L53.40 136.20 L48.00 142.80 L46.80 147.00 L46.80 187.80 L49.80 190.80 L58.20 194.40 L58.80 241.20 L59.40 241.80 L59.40 252.00 L60.60 256.20 L62.40 259.80 L66.00 263.40 L68.40 264.60 L78.60 268.20 L97.20 271.20 L97.80 274.80 L97.80 325.20 L96.60 331.80 L94.80 335.40 L91.20 339.00 L72.00 349.20 L67.20 352.80 L59.40 360.60 L55.20 366.60 L51.60 373.80 L48.60 384.00 L48.00 394.20 L46.20 396.60 L46.20 522.60 L45.60 523.20 L46.20 525.60 L46.20 735.00 L47.40 735.60 L47.40 744.00 L48.60 751.80 L52.80 762.00 L60.60 769.80 L67.80 774.00 L82.20 777.00 L110.40 778.20 L182.40 778.80 L265.20 777.60 L281.40 775.80 L293.40 771.60 L302.40 763.80 L307.20 753.60 L308.40 747.00 L308.40 737.40 L310.20 734.40 L310.20 399.00 L308.40 394.20 L308.40 389.40 L306.00 377.40 L298.80 363.00 L289.20 352.80 L284.40 349.20 L263.40 337.20 L259.20 330.60 L258.60 327.60 L258.60 271.20 L260.40 270.00 L273.00 268.20 L284.40 265.20 L290.40 262.20 L294.00 258.60 L296.40 253.80 L297.60 240.60 L298.20 192.60 L307.20 189.00 L309.00 186.60 L309.00 145.20 L307.80 141.00 L304.20 136.20 L298.20 132.00 L288.60 129.00 L273.00 126.00 L223.20 121.80 Z";
export const DYSPORT_ASSET = 'products/dysport-3d.png';
export const DYSPORT_BOUNDS = {left:45.6, top:121.2, right:310.2, bottom:778.8} as const;

export const DysportProduct: React.FC<{outline?:boolean;id?:string}> = ({outline=false,id='dysport'}) => {
  const clipId=`${id}-dysport-silhouette`;
  return <svg xmlns="http://www.w3.org/2000/svg" width="360" height="900" viewBox="0 0 360 900"
    data-product-kind="dysport" style={{overflow:'visible',display:'block'}}>
    {outline
      ? <path data-product-silhouette d={DYSPORT_SILHOUETTE} fill="none" stroke={PAUSE_SALE.colors.gold}
          strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round"/>
      : <>
          <defs><clipPath id={clipId}><path data-product-silhouette d={DYSPORT_SILHOUETTE}/></clipPath></defs>
          <image href={staticFile(DYSPORT_ASSET)} x="-198" y="72" width="752.4" height="752.4"
            clipPath={`url(#${clipId})`} preserveAspectRatio="none"/>
        </>}
  </svg>;
};
