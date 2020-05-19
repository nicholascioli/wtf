attribute vec3 pos;
attribute vec3 nor;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;

uniform mat4 InverseM;

uniform vec3 light_pos;
uniform vec3 cam_pos;

uniform vec3 color;
uniform vec3 light_dir;

uniform float light_inner_dot;
uniform float light_outer_dot;

varying vec3 real_color;

void main() {
	gl_Position = P * V * M * vec4(pos, 1.0);

	vec3 Pos0 = (M * vec4(pos, 1.0)).xyz;

	float ambient = 0.05;
	vec3 normal = normalize(mat3(InverseM) * nor);
	vec3 to_light = normalize(light_pos - Pos0);
	vec3 to_view = normalize(cam_pos - Pos0);

	// Specular
	vec3 half_vector = normalize(to_light + to_view);

	float dot_from = dot(to_light, -normalize(light_dir));
	float inLight = smoothstep(light_outer_dot, light_inner_dot, dot_from);
	float light = inLight * dot(normal, to_light);
	float specular = inLight * pow(dot(normal, half_vector), 150.0);

	float selection = smoothstep(0.03, 0.05, abs(length(Pos0 - vec3(light_dir[0], 0.0, light_dir[2]))));

	real_color = max(color * light + specular, ambient * color);
}