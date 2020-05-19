export interface AttributeInfo {
	stride: number;
	offset: number;
	normalize: boolean;
}

export interface Attribute {
	_enabled: boolean;
	_value: any;
	handle: GLenum;

	enable(info?: AttributeInfo): void;
	disable(): void;
	value(): any;
	value(v: any): any;
}

export const BYTE_SIZE  = 1;
export const SHORT_SIZE = 2;
export const FLOAT_SIZE = 4;