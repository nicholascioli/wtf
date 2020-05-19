precision mediump float;
uniform vec3 color;
uniform vec3 light_dir;

uniform float light_inner_dot;
uniform float light_outer_dot;

varying vec3 Pos0;
varying vec3 Norm0;
varying vec3 ToLight;
varying vec3 ToView;

void main() {
	float ambient = 0.05;
	vec3 normal = normalize(Norm0);
	vec3 to_light = normalize(ToLight);
	vec3 to_view = normalize(ToView);

	// Specular
	vec3 half_vector = normalize(to_light + to_view);

	float dot_from = dot(to_light, -normalize(light_dir));
	float inLight = smoothstep(light_outer_dot, light_inner_dot, dot_from);
	float light = inLight * dot(normal, to_light);
	float specular = inLight * pow(dot(normal, half_vector), 150.0);

	gl_FragColor = vec4(max(color * light + specular, ambient * color), 1.0);
}