// Fragment Shader
// ----
// Creates Julia Set fractals given the following parameters.
// ----
// ratio       - The screen ratio as width / height
// screen_size - The size of the screen in (width, height) pixels
// center      - The current center of the display. Allows for moving around
// scale       - The current scale. Allows for zooming in / out
//
// iteration_count   - How many iterations to compute in order to check if bound
// complex_parameter - The complex parameter to add to each iteration. In (real, imaginary, enable) format
// power             - The power to raise each iteration
precision mediump float;

uniform float ratio;
uniform vec2  screen_size;
uniform vec2  center;
uniform float scale;

uniform int   iteration_count;
uniform vec3  complex_parameter;
uniform float power;

const int MAX_ITER = 10000;

// Maps an iteration count to a color for more stylish colors
vec4 map_to_color(float t) {
	float r = 9.0 * (1.0 - t) * t * t * t;
	float g = 15.0 * (1.0 - t) * (1.0 - t) * t * t;
	float b = 8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t;

	return vec4(r, g, b, 1.0);
}

// Raises a complex number in the form (real, imaginary) to a given power
// See https://math.stackexchange.com/a/1397449
vec2 complex_power(vec2 c, float n) {
	vec2 res;
	float r = length(c);
	float theta = atan(c.y, c.x);
	float rn = pow(r, n);

	res.x = rn * (cos(theta * n));
	res.y = rn * (sin(theta * n));

	return res;
}

// Returns the magnitude, index, and max iteration count for a starting complex value c
vec3 bound(vec2 c) {
	vec2 z = c;
	float upper_bound = float(MAX_ITER > iteration_count ? iteration_count : MAX_ITER);

	for (int i = 0; i != MAX_ITER; ++i) {
		// WebGL does not allow for non-const expressions in for loop conditions
		if (i == iteration_count) break;

		// Allow for generating the mandelbrot set if no custom complex parameter is specified
		vec2 nz;
		if (complex_parameter.z > 0.5)
			nz = complex_power(z, power) + complex_parameter.xy;
		else
			nz = complex_power(z, power) + c;

		// Short-circuit if magnitude is larger than 2 (unbounded)
		if (length(nz) > 2.0) return vec3(-1.0, i, upper_bound);

		// Set z for the next iteration
		z = nz;
	}

	return vec3(length(z), upper_bound, upper_bound);
}

void main() {
	// Convert the fragment position to its complex equivalent in the range [-2 - 2i, 2 + 2i]
	// Also, scale and transform it to match the current viewport
	vec2 c = vec2(
		((gl_FragCoord.x / screen_size.x * 2.0 - 1.0) * 2.0 + center.x) / scale * ratio,
		((gl_FragCoord.y / screen_size.y * 2.0 - 1.0) * 2.0 + center.y) / scale
	);

	// Get the bounding information for the fragment
	vec3 b = bound(c);
	float bound_length = b.x / 2.0;

	// Color it accordingly
	gl_FragColor = map_to_color(b.y / b.z);
}