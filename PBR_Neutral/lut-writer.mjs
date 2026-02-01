/* @license
 * Copyright 2024 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Running:
// node lut-writer.mjs
// produces: passableNeutral.cube

import * as fs from 'fs';

const size = 57;
// must match the lg2 vars in config.ocio
const log2Min = -9;
const log2Max = 10;

const text = [
  `TITLE "PBR Neutral sRGB"`,
  `# PBR Neutral sRGB LUT`,
  `DOMAIN_MIN 0 0 0`,
  `DOMAIN_MAX 1 1 1`,
  `LUT_3D_SIZE ${size}`,
];

function clamp(x) {
  return Math.min(Math.max(x, 0), 1);
}

function round(x) {
  return clamp(x).toFixed(7).replace(/\.?0*$/, '');
}

function inverseLog(x) {
  const log2 = (x / (size - 1)) * (log2Max - log2Min) + log2Min;
  return Math.pow(2, log2);
}

function rgb2string(rgb) {
  return `${round(rgb.R)} ${round(rgb.G)} ${round(rgb.B)}`;
}
function linear_srgb_to_oklab(rgb) 
{
     let {R, G, B} = rgb;
     const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
	 const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
	 const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;

     const l_ = Math.cbrt(l);
     const m_ = Math.cbrt(m);
     const s_ = Math.cbrt(s);


      R = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
      G =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
      B =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

     return {R, G, B};
}
function oklab_to_linear_srgb(Lab) 
{
     let {X, Y, Z} = Lab
     const l_ = X + 0.3963377774 * Y + 0.2158037573 * Z;
     const m_ = X - 0.1055613458 * Y - 0.0638541728 * Z;
     const s_ = X - 0.0894841775 * Y - 1.2914855480 * Z;

     const l = l_*l_*l_;
     const m = m_*m_*m_;
     const s = s_*s_*s_;

   
	X =	+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	Y =	-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	Z =	-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    return {X, Y, Z};
}

function pbrNeutral(rgb) {
  const startCompression = 0.8 - 0.04;
  const desaturation = 0.15;

  let {R, G, B} = rgb;

  const x = Math.min(R, G, B);
  const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  R -= offset;
  G -= offset;
  B -= offset;

  const peak = Math.max(R, G, B);
  if (peak < startCompression) {
    return {R, G, B};
  }

  const d = 1 - startCompression;
  const newPeak = 1 - d * d / (peak + d - startCompression);
  const scale = newPeak / peak;
  R *= scale;
  G *= scale;
  B *= scale;
  //let {L, a, b} = linear_srgb_to_oklab(R, G, B);
     const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
	 const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
	 const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;

     const l_ = Math.cbrt(l);
     const m_ = Math.cbrt(m);
     const s_ = Math.cbrt(s);


      R = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
      G =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
      B =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const f = 1 / (desaturation * (peak - newPeak) + 1);
  R = f * R + (1 - f) * newPeak;
  G = f * G;
  B = f * B;
  //let {R2, G2, B2} = oklab_to_linear_srgb(L, a, b); 
     const l_2 = R + 0.3963377774 * G + 0.2158037573 * B;
     const m_2 = R - 0.1055613458 * G - 0.0638541728 * B;
     const s_2 = R - 0.0894841775 * G - 1.2914855480 * B;

     const l2 = l_2*l_2*l_2;
     const m2 = m_2*m_2*m_2;
     const s2 = s_2*s_2*s_2;

   
	R =	+4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2;
	G =	-1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2;
	B =	-0.0041960863 * l2 - 0.7034186147 * m2 + 1.7076147010 * s2;
  return {R, G, B};
}

function inverseNeutral(rgb) {
  const startCompression = 0.8 - 0.04;
  const desaturation = 0.15;

  let {R, G, B} = rgb;

  const peak = Math.max(R, G, B);
  if (peak > startCompression) {
    const d = 1 - startCompression;
    const oldPeak = d * d / (1 - peak) - d + startCompression;
    const fInv = desaturation * (oldPeak - peak) + 1;
    const f = 1 / fInv;
    R = (R + (f - 1) * peak) * fInv;
    G = (G + (f - 1) * peak) * fInv;
    B = (B + (f - 1) * peak) * fInv;
    const scale = oldPeak / peak;
    R *= scale;
    G *= scale;
    B *= scale;
  }

  const y = Math.min(R, G, B);
  let offset = 0.04;
  if (y < 0.04) {
    const x = Math.sqrt(y / 6.25);
    offset = x - 6.25 * x * x;
  }
  R += offset;
  G += offset;
  B += offset;

  return {R, G, B};
}

function relativeError(rgbBase, rgbCheck) {
  const {R, G, B} = rgbBase;
  const dR = rgbCheck.R - R;
  const dG = rgbCheck.G - G;
  const dB = rgbCheck.B - B;
  const dMag = Math.sqrt(dR * dR + dG * dG + dB * dB);
  const dBase = Math.max(Math.sqrt(R * R + G * G + B * B), 1e-20);
  return dMag / dBase;
}

let maxError = 0;
for (let b = 0; b < size; ++b) {
  for (let g = 0; g < size; ++g) {
    for (let r = 0; r < size; ++r) {
      // invert the lg2 transform in the OCIO config - used to more evenly-space
      // the LUT points
      const rgbIn = {R: inverseLog(r), G: inverseLog(g), B: inverseLog(b)};
      const rgbOut = pbrNeutral(rgbIn);
      text.push(rgb2string(rgbOut));
      // verify inverse
      const rgbIn2 = inverseNeutral(rgbOut);
      const error = relativeError(rgbIn, rgbIn2);
      maxError = Math.max(maxError, error);
    }
  }
}
text.push('');

console.log('Maximum relative error of inverse = ', maxError);

fs.writeFileSync('passableNeutral.cube', text.join('\n'));