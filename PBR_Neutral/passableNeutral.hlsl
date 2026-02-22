// Input color is non-negative and resides in the Linear Rec. 709 color space.
// Output color is also Linear Rec. 709, but in the [0, 1] range.

float3 PassableNeutralDTF( float3 color ) {
	const float startCompression = 0.8 - 0.04;
	const float desaturation = .3;
	static const float3x3 rgb2ok = {
	     0.412165612, 0.211859107, 0.0883097947,
	     0.536275208, 0.6807189584, 0.2818474174,
	     0.0514575653, 0.107406579, 0.6302613616,
	};
	static const float3x3 ok2rgb = {
		+4.0767416621, -1.2684380046, -0.0041960863,
		-3.3077115913, +2.6097574011, -0.7034186147,
		+0.2309699292, -0.3413193965, +1.7076147010,
	};
	float x = min(color.r, min(color.g, color.b));
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;

	float peak = max(color.r, max(color.g, color.b));
	if (peak < startCompression) return color;

	const float d = 1. - startCompression;
	float newPeak = 1. - d * d / (peak + d - startCompression);
	color *= newPeak / peak;

	color = mul(color, rgb2ok);
	color = pow(color, 1.0 / 3.0);

	float g = 1. - 1. / (desaturation * (peak - newPeak) + 1.);
	color = lerp(color, newPeak * float3(1, 1, 1), g);

	return mul(color * color * color, ok2rgb);
}
