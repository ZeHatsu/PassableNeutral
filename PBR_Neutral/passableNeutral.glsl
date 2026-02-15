// Input color is non-negative and resides in the Linear Rec. 709 color space.
// Output color is also Linear Rec. 709, but in the [0, 1] range.

vec3 PassableNeutralToneMapping( vec3 color ) {
  const float startCompression = 0.8 - 0.04;
  const float desaturation = 0.3;
  const mat3 rgb2ok = mat3(0.4121656120, 0.2118591070, 0.0883097947,
                             0.5362752080, 0.6807189584, 0.2818474174,
                             0.0514575653, 0.1074065790, 0.6302613616);
  const mat3 ok2rgb = mat3(+4.076724529, -1.268143773, -0.004111989,
                             -3.307216883, +2.609332323, -0.703476310,
                             +0.230759054, -0.341134429, +1.706862569);

  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;

  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;

  const float d = 1. - startCompression;
  float newPeak = 1. - d * d / (peak + d - startCompression);
  color *= newPeak / peak;

  color = rgb2ok * color;
  color = pow(color, vec3(1.0 / 3.0));

  float g = 1. - 1. / (desaturation * (peak - newPeak) + 1.);
  color = mix(color, newPeak * vec3(1, 1, 1), g);
  return ok2rgb * (color * color * color);
}