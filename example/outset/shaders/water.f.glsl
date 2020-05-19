precision highp float;

uniform sampler2D texture;
uniform sampler2D distort;

uniform vec3 light_dir;
uniform float time_elapsed;
uniform float water_distort;

varying highp vec2 UV0;
varying vec3 Norm0;

vec3 water_color = vec3(0.01837, 0.7237, 0.8140);
vec2 water_scroll = vec2(0.03, 0.03);

float repeat = 14.0;
float noise_cutoff = 0.777;

void main() {
	vec3 norm = normalize(Norm0);
	float light = 2.0 * dot(norm, light_dir);
	vec2 time_uvs = UV0 + time_elapsed * water_scroll;

	vec2 distort_uv = (texture2D(distort, repeat * UV0).xy * 2.0 - 1.0) * water_distort;
	vec2 noise_uvs = distort_uv + time_uvs;

	gl_FragColor = texture2D(texture, repeat * noise_uvs);
}