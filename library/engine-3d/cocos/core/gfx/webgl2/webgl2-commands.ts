import { CachedArray } from '../../memop/cached-array';
import { error, errorID } from '../../platform';
import { GFXBufferSource, GFXDrawInfo, IGFXIndirectBuffer } from '../buffer';
import {
    GFXBufferTextureCopy,
    GFXBufferUsageBit,
    GFXColorMask,
    GFXCullMode,
    GFXDynamicStateFlagBit,
    GFXFilter,
    GFXFormat,
    GFXFormatInfos,
    GFXFormatSize,
    GFXLoadOp,
    GFXMemoryUsageBit,
    GFXSampleCount,
    GFXShaderStageFlagBit,
    GFXStencilFace,
    GFXTextureFlagBit,
    GFXTextureType,
    GFXType,
    GFXColor,
    GFXFormatInfo,
    GFXRect,
    GFXViewport,
} from '../define';
import { WebGLEXT } from '../webgl/webgl-define';
import { WebGL2CommandAllocator } from './webgl2-command-allocator';
import {
    IWebGL2DepthBias,
    IWebGL2DepthBounds,
    IWebGL2StencilCompareMask,
    IWebGL2StencilWriteMask,
} from './webgl2-command-buffer';
import { WebGL2Device } from './webgl2-device';
import {
    IWebGL2GPUInputAssembler,
    IWebGL2GPUUniform,
    IWebGL2Attrib,
    IWebGL2GPUDescriptorSet,
    IWebGL2GPUBuffer,
    IWebGL2GPUFramebuffer,
    IWebGL2GPUInput,
    IWebGL2GPUPipelineState,
    IWebGL2GPUSampler,
    IWebGL2GPUShader,
    IWebGL2GPUTexture,
    IWebGL2GPUUniformBlock,
    IWebGL2GPUUniformSampler,
    IWebGL2GPURenderPass,
} from './webgl2-gpu-objects';
import { GFXUniformBlock } from '../shader';

const WebGLWraps: GLenum[] = [
    0x2901, // WebGLRenderingContext.REPEAT
    0x8370, // WebGLRenderingContext.MIRRORED_REPEAT
    0x812F, // WebGLRenderingContext.CLAMP_TO_EDGE
    0x812F, // WebGLRenderingContext.CLAMP_TO_EDGE
];

const SAMPLES: number[] = [
    1,
    2,
    4,
    8,
    16,
    32,
    64,
];

const _f32v4 = new Float32Array(4);

// tslint:disable: max-line-length

function CmpF32NotEuqal (a: number, b: number): boolean {
    const c = a - b;
    return (c > 0.000001 || c < -0.000001);
}

export function GFXFormatToWebGLType (format: GFXFormat, gl: WebGL2RenderingContext): GLenum {
    switch (format) {
        case GFXFormat.R8: return gl.UNSIGNED_BYTE;
        case GFXFormat.R8SN: return gl.BYTE;
        case GFXFormat.R8UI: return gl.UNSIGNED_BYTE;
        case GFXFormat.R8I: return gl.BYTE;
        case GFXFormat.R16F: return gl.HALF_FLOAT;
        case GFXFormat.R16UI: return gl.UNSIGNED_SHORT;
        case GFXFormat.R16I: return gl.SHORT;
        case GFXFormat.R32F: return gl.FLOAT;
        case GFXFormat.R32UI: return gl.UNSIGNED_INT;
        case GFXFormat.R32I: return gl.INT;

        case GFXFormat.RG8: return gl.UNSIGNED_BYTE;
        case GFXFormat.RG8SN: return gl.BYTE;
        case GFXFormat.RG8UI: return gl.UNSIGNED_BYTE;
        case GFXFormat.RG8I: return gl.BYTE;
        case GFXFormat.RG16F: return gl.HALF_FLOAT;
        case GFXFormat.RG16UI: return gl.UNSIGNED_SHORT;
        case GFXFormat.RG16I: return gl.SHORT;
        case GFXFormat.RG32F: return gl.FLOAT;
        case GFXFormat.RG32UI: return gl.UNSIGNED_INT;
        case GFXFormat.RG32I: return gl.INT;

        case GFXFormat.RGB8: return gl.UNSIGNED_BYTE;
        case GFXFormat.SRGB8: return gl.UNSIGNED_BYTE;
        case GFXFormat.RGB8SN: return gl.BYTE;
        case GFXFormat.RGB8UI: return gl.UNSIGNED_BYTE;
        case GFXFormat.RGB8I: return gl.BYTE;
        case GFXFormat.RGB16F: return gl.HALF_FLOAT;
        case GFXFormat.RGB16UI: return gl.UNSIGNED_SHORT;
        case GFXFormat.RGB16I: return gl.SHORT;
        case GFXFormat.RGB32F: return gl.FLOAT;
        case GFXFormat.RGB32UI: return gl.UNSIGNED_INT;
        case GFXFormat.RGB32I: return gl.INT;

        case GFXFormat.BGRA8: return gl.UNSIGNED_BYTE;
        case GFXFormat.RGBA8: return gl.UNSIGNED_BYTE;
        case GFXFormat.SRGB8_A8: return gl.UNSIGNED_BYTE;
        case GFXFormat.RGBA8SN: return gl.BYTE;
        case GFXFormat.RGBA8UI: return gl.UNSIGNED_BYTE;
        case GFXFormat.RGBA8I: return gl.BYTE;
        case GFXFormat.RGBA16F: return gl.HALF_FLOAT;
        case GFXFormat.RGBA16UI: return gl.UNSIGNED_SHORT;
        case GFXFormat.RGBA16I: return gl.SHORT;
        case GFXFormat.RGBA32F: return gl.FLOAT;
        case GFXFormat.RGBA32UI: return gl.UNSIGNED_INT;
        case GFXFormat.RGBA32I: return gl.INT;

        case GFXFormat.R5G6B5: return gl.UNSIGNED_SHORT_5_6_5;
        case GFXFormat.R11G11B10F: return gl.UNSIGNED_INT_10F_11F_11F_REV;
        case GFXFormat.RGB5A1: return gl.UNSIGNED_SHORT_5_5_5_1;
        case GFXFormat.RGBA4: return gl.UNSIGNED_SHORT_4_4_4_4;
        case GFXFormat.RGB10A2: return gl.UNSIGNED_INT_2_10_10_10_REV;
        case GFXFormat.RGB10A2UI: return gl.UNSIGNED_INT_2_10_10_10_REV;
        case GFXFormat.RGB9E5: return gl.FLOAT;

        case GFXFormat.D16: return gl.UNSIGNED_SHORT;
        case GFXFormat.D16S8: return gl.UNSIGNED_INT_24_8; // no D16S8 support
        case GFXFormat.D24: return gl.UNSIGNED_INT;
        case GFXFormat.D24S8: return gl.UNSIGNED_INT_24_8;
        case GFXFormat.D32F: return gl.FLOAT;
        case GFXFormat.D32F_S8: return gl.FLOAT_32_UNSIGNED_INT_24_8_REV;

        case GFXFormat.BC1: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC1_SRGB: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC2: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC2_SRGB: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC3: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC3_SRGB: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC4: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC4_SNORM: return gl.BYTE;
        case GFXFormat.BC5: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC5_SNORM: return gl.BYTE;
        case GFXFormat.BC6H_SF16: return gl.FLOAT;
        case GFXFormat.BC6H_UF16: return gl.FLOAT;
        case GFXFormat.BC7: return gl.UNSIGNED_BYTE;
        case GFXFormat.BC7_SRGB: return gl.UNSIGNED_BYTE;

        case GFXFormat.ETC_RGB8: return gl.UNSIGNED_BYTE;
        case GFXFormat.ETC2_RGB8: return gl.UNSIGNED_BYTE;
        case GFXFormat.ETC2_SRGB8: return gl.UNSIGNED_BYTE;
        case GFXFormat.ETC2_RGB8_A1: return gl.UNSIGNED_BYTE;
        case GFXFormat.ETC2_SRGB8_A1: return gl.UNSIGNED_BYTE;
        case GFXFormat.ETC2_RGB8: return gl.UNSIGNED_BYTE;
        case GFXFormat.ETC2_SRGB8: return gl.UNSIGNED_BYTE;
        case GFXFormat.EAC_R11: return gl.UNSIGNED_BYTE;
        case GFXFormat.EAC_R11SN: return gl.BYTE;
        case GFXFormat.EAC_RG11: return gl.UNSIGNED_BYTE;
        case GFXFormat.EAC_RG11SN: return gl.BYTE;

        case GFXFormat.PVRTC_RGB2: return gl.UNSIGNED_BYTE;
        case GFXFormat.PVRTC_RGBA2: return gl.UNSIGNED_BYTE;
        case GFXFormat.PVRTC_RGB4: return gl.UNSIGNED_BYTE;
        case GFXFormat.PVRTC_RGBA4: return gl.UNSIGNED_BYTE;
        case GFXFormat.PVRTC2_2BPP: return gl.UNSIGNED_BYTE;
        case GFXFormat.PVRTC2_4BPP: return gl.UNSIGNED_BYTE;

        case GFXFormat.ASTC_RGBA_4x4:
        case GFXFormat.ASTC_RGBA_5x4:
        case GFXFormat.ASTC_RGBA_5x5:
        case GFXFormat.ASTC_RGBA_6x5:
        case GFXFormat.ASTC_RGBA_6x6:
        case GFXFormat.ASTC_RGBA_8x5:
        case GFXFormat.ASTC_RGBA_8x6:
        case GFXFormat.ASTC_RGBA_8x8:
        case GFXFormat.ASTC_RGBA_10x5:
        case GFXFormat.ASTC_RGBA_10x6:
        case GFXFormat.ASTC_RGBA_10x8:
        case GFXFormat.ASTC_RGBA_10x10:
        case GFXFormat.ASTC_RGBA_12x10:
        case GFXFormat.ASTC_RGBA_12x12:
        case GFXFormat.ASTC_SRGBA_4x4:
        case GFXFormat.ASTC_SRGBA_5x4:
        case GFXFormat.ASTC_SRGBA_5x5:
        case GFXFormat.ASTC_SRGBA_6x5:
        case GFXFormat.ASTC_SRGBA_6x6:
        case GFXFormat.ASTC_SRGBA_8x5:
        case GFXFormat.ASTC_SRGBA_8x6:
        case GFXFormat.ASTC_SRGBA_8x8:
        case GFXFormat.ASTC_SRGBA_10x5:
        case GFXFormat.ASTC_SRGBA_10x6:
        case GFXFormat.ASTC_SRGBA_10x8:
        case GFXFormat.ASTC_SRGBA_10x10:
        case GFXFormat.ASTC_SRGBA_12x10:
        case GFXFormat.ASTC_SRGBA_12x12:
            return gl.UNSIGNED_BYTE;

        default: {
            return gl.UNSIGNED_BYTE;
        }
    }
}

export function GFXFormatToWebGLInternalFormat (format: GFXFormat, gl: WebGL2RenderingContext): GLenum {
    switch (format) {
        case GFXFormat.A8: return gl.ALPHA;
        case GFXFormat.L8: return gl.LUMINANCE;
        case GFXFormat.LA8: return gl.LUMINANCE_ALPHA;
        case GFXFormat.R8: return gl.R8;
        case GFXFormat.R8SN: return gl.R8_SNORM;
        case GFXFormat.R8UI: return gl.R8UI;
        case GFXFormat.R8I: return gl.R8I;
        case GFXFormat.RG8: return gl.RG8;
        case GFXFormat.RG8SN: return gl.RG8_SNORM;
        case GFXFormat.RG8UI: return gl.RG8UI;
        case GFXFormat.RG8I: return gl.RG8I;
        case GFXFormat.RGB8: return gl.RGB8;
        case GFXFormat.RGB8SN: return gl.RGB8_SNORM;
        case GFXFormat.RGB8UI: return gl.RGB8UI;
        case GFXFormat.RGB8I: return gl.RGB8I;
        case GFXFormat.BGRA8: return gl.RGBA8;
        case GFXFormat.RGBA8: return gl.RGBA8;
        case GFXFormat.RGBA8SN: return gl.RGBA8_SNORM;
        case GFXFormat.RGBA8UI: return gl.RGBA8UI;
        case GFXFormat.RGBA8I: return gl.RGBA8I;
        case GFXFormat.R16I: return gl.R16I;
        case GFXFormat.R16UI: return gl.R16UI;
        case GFXFormat.R16F: return gl.R16F;
        case GFXFormat.RG16I: return gl.RG16I;
        case GFXFormat.RG16UI: return gl.RG16UI;
        case GFXFormat.RG16F: return gl.RG16F;
        case GFXFormat.RGB16I: return gl.RGB16I;
        case GFXFormat.RGB16UI: return gl.RGB16UI;
        case GFXFormat.RGB16F: return gl.RGB16F;
        case GFXFormat.RGBA16I: return gl.RGBA16I;
        case GFXFormat.RGBA16UI: return gl.RGBA16UI;
        case GFXFormat.RGBA16F: return gl.RGBA16F;
        case GFXFormat.R32I: return gl.R32I;
        case GFXFormat.R32UI: return gl.R32UI;
        case GFXFormat.R32F: return gl.R32F;
        case GFXFormat.RG32I: return gl.RG32I;
        case GFXFormat.RG32UI: return gl.RG32UI;
        case GFXFormat.RG32F: return gl.RG32F;
        case GFXFormat.RGB32I: return gl.RGB32I;
        case GFXFormat.RGB32UI: return gl.RGB32UI;
        case GFXFormat.RGB32F: return gl.RGB32F;
        case GFXFormat.RGBA32I: return gl.RGBA32I;
        case GFXFormat.RGBA32UI: return gl.RGBA32UI;
        case GFXFormat.RGBA32F: return gl.RGBA32F;
        case GFXFormat.R5G6B5: return gl.RGB565;
        case GFXFormat.RGB5A1: return gl.RGB5_A1;
        case GFXFormat.RGBA4: return gl.RGBA4;
        case GFXFormat.RGB10A2: return gl.RGB10_A2;
        case GFXFormat.RGB10A2UI: return gl.RGB10_A2UI;
        case GFXFormat.R11G11B10F: return gl.R11F_G11F_B10F;
        case GFXFormat.D16: return gl.DEPTH_COMPONENT16;
        case GFXFormat.D16S8: return gl.DEPTH24_STENCIL8; // no D16S8 support
        case GFXFormat.D24: return gl.DEPTH_COMPONENT24;
        case GFXFormat.D24S8: return gl.DEPTH24_STENCIL8;
        case GFXFormat.D32F: return gl.DEPTH_COMPONENT32F;
        case GFXFormat.D32F_S8: return gl.DEPTH32F_STENCIL8;

        case GFXFormat.BC1: return WebGLEXT.COMPRESSED_RGB_S3TC_DXT1_EXT;
        case GFXFormat.BC1_ALPHA: return WebGLEXT.COMPRESSED_RGBA_S3TC_DXT1_EXT;
        case GFXFormat.BC1_SRGB: return WebGLEXT.COMPRESSED_SRGB_S3TC_DXT1_EXT;
        case GFXFormat.BC1_SRGB_ALPHA: return WebGLEXT.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
        case GFXFormat.BC2: return WebGLEXT.COMPRESSED_RGBA_S3TC_DXT3_EXT;
        case GFXFormat.BC2_SRGB: return WebGLEXT.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
        case GFXFormat.BC3: return WebGLEXT.COMPRESSED_RGBA_S3TC_DXT5_EXT;
        case GFXFormat.BC3_SRGB: return WebGLEXT.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;

        case GFXFormat.ETC_RGB8: return WebGLEXT.COMPRESSED_RGB_ETC1_WEBGL;
        case GFXFormat.ETC2_RGB8: return WebGLEXT.COMPRESSED_RGB8_ETC2;
        case GFXFormat.ETC2_SRGB8: return WebGLEXT.COMPRESSED_SRGB8_ETC2;
        case GFXFormat.ETC2_RGB8_A1: return WebGLEXT.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2;
        case GFXFormat.ETC2_SRGB8_A1: return WebGLEXT.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2;
        case GFXFormat.ETC2_RGBA8: return WebGLEXT.COMPRESSED_RGBA8_ETC2_EAC;
        case GFXFormat.ETC2_SRGB8_A8: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC;
        case GFXFormat.EAC_R11: return WebGLEXT.COMPRESSED_R11_EAC;
        case GFXFormat.EAC_R11SN: return WebGLEXT.COMPRESSED_SIGNED_R11_EAC;
        case GFXFormat.EAC_RG11: return WebGLEXT.COMPRESSED_RG11_EAC;
        case GFXFormat.EAC_RG11SN: return WebGLEXT.COMPRESSED_SIGNED_RG11_EAC;

        case GFXFormat.PVRTC_RGB2: return WebGLEXT.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
        case GFXFormat.PVRTC_RGBA2: return WebGLEXT.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
        case GFXFormat.PVRTC_RGB4: return WebGLEXT.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        case GFXFormat.PVRTC_RGBA4: return WebGLEXT.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;

        case GFXFormat.ASTC_RGBA_4x4: return WebGLEXT.COMPRESSED_RGBA_ASTC_4x4_KHR;
        case GFXFormat.ASTC_RGBA_5x4: return WebGLEXT.COMPRESSED_RGBA_ASTC_5x4_KHR;
        case GFXFormat.ASTC_RGBA_5x5: return WebGLEXT.COMPRESSED_RGBA_ASTC_5x5_KHR;
        case GFXFormat.ASTC_RGBA_6x5: return WebGLEXT.COMPRESSED_RGBA_ASTC_6x5_KHR;
        case GFXFormat.ASTC_RGBA_6x6: return WebGLEXT.COMPRESSED_RGBA_ASTC_6x6_KHR;
        case GFXFormat.ASTC_RGBA_8x5: return WebGLEXT.COMPRESSED_RGBA_ASTC_8x5_KHR;
        case GFXFormat.ASTC_RGBA_8x6: return WebGLEXT.COMPRESSED_RGBA_ASTC_8x6_KHR;
        case GFXFormat.ASTC_RGBA_8x8: return WebGLEXT.COMPRESSED_RGBA_ASTC_8x8_KHR;
        case GFXFormat.ASTC_RGBA_10x5: return WebGLEXT.COMPRESSED_RGBA_ASTC_10x5_KHR;
        case GFXFormat.ASTC_RGBA_10x6: return WebGLEXT.COMPRESSED_RGBA_ASTC_10x6_KHR;
        case GFXFormat.ASTC_RGBA_10x8: return WebGLEXT.COMPRESSED_RGBA_ASTC_10x8_KHR;
        case GFXFormat.ASTC_RGBA_10x10: return WebGLEXT.COMPRESSED_RGBA_ASTC_10x10_KHR;
        case GFXFormat.ASTC_RGBA_12x10: return WebGLEXT.COMPRESSED_RGBA_ASTC_12x10_KHR;
        case GFXFormat.ASTC_RGBA_12x12: return WebGLEXT.COMPRESSED_RGBA_ASTC_12x12_KHR;

        case GFXFormat.ASTC_SRGBA_4x4: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR;
        case GFXFormat.ASTC_SRGBA_5x4: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR;
        case GFXFormat.ASTC_SRGBA_5x5: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR;
        case GFXFormat.ASTC_SRGBA_6x5: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR;
        case GFXFormat.ASTC_SRGBA_6x6: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR;
        case GFXFormat.ASTC_SRGBA_8x5: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR;
        case GFXFormat.ASTC_SRGBA_8x6: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR;
        case GFXFormat.ASTC_SRGBA_8x8: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR;
        case GFXFormat.ASTC_SRGBA_10x5: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR;
        case GFXFormat.ASTC_SRGBA_10x6: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR;
        case GFXFormat.ASTC_SRGBA_10x8: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR;
        case GFXFormat.ASTC_SRGBA_10x10: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR;
        case GFXFormat.ASTC_SRGBA_12x10: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR;
        case GFXFormat.ASTC_SRGBA_12x12: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR;

        default: {
            console.error('Unsupported GFXFormat, convert to WebGL internal format failed.');
            return gl.RGBA;
        }
    }
}

export function GFXFormatToWebGLFormat (format: GFXFormat, gl: WebGL2RenderingContext): GLenum {
    switch (format) {
        case GFXFormat.A8: return gl.ALPHA;
        case GFXFormat.L8: return gl.LUMINANCE;
        case GFXFormat.LA8: return gl.LUMINANCE_ALPHA;
        case GFXFormat.R8:
        case GFXFormat.R8SN: return gl.RED;
        case GFXFormat.R8UI:
        case GFXFormat.R8I: return gl.RED;
        case GFXFormat.RG8:
        case GFXFormat.RG8SN:
        case GFXFormat.RG8UI:
        case GFXFormat.RG8I: return gl.RG;
        case GFXFormat.RGB8:
        case GFXFormat.RGB8SN:
        case GFXFormat.RGB8UI:
        case GFXFormat.RGB8I: return gl.RGB;
        case GFXFormat.BGRA8:
        case GFXFormat.RGBA8:
        case GFXFormat.RGBA8SN:
        case GFXFormat.RGBA8UI:
        case GFXFormat.RGBA8I: return gl.RGBA;
        case GFXFormat.R16UI:
        case GFXFormat.R16I:
        case GFXFormat.R16F: return gl.RED;
        case GFXFormat.RG16UI:
        case GFXFormat.RG16I:
        case GFXFormat.RG16F: return gl.RG;
        case GFXFormat.RGB16UI:
        case GFXFormat.RGB16I:
        case GFXFormat.RGB16F: return gl.RGB;
        case GFXFormat.RGBA16UI:
        case GFXFormat.RGBA16I:
        case GFXFormat.RGBA16F: return gl.RGBA;
        case GFXFormat.R32UI:
        case GFXFormat.R32I:
        case GFXFormat.R32F: return gl.RED;
        case GFXFormat.RG32UI:
        case GFXFormat.RG32I:
        case GFXFormat.RG32F: return gl.RG;
        case GFXFormat.RGB32UI:
        case GFXFormat.RGB32I:
        case GFXFormat.RGB32F: return gl.RGB;
        case GFXFormat.RGBA32UI:
        case GFXFormat.RGBA32I:
        case GFXFormat.RGBA32F: return gl.RGBA;
        case GFXFormat.RGB10A2: return gl.RGBA;
        case GFXFormat.R11G11B10F: return gl.RGB;
        case GFXFormat.R5G6B5: return gl.RGB;
        case GFXFormat.RGB5A1: return gl.RGBA;
        case GFXFormat.RGBA4: return gl.RGBA;
        case GFXFormat.D16: return gl.DEPTH_COMPONENT;
        case GFXFormat.D16S8: return gl.DEPTH_STENCIL;
        case GFXFormat.D24: return gl.DEPTH_COMPONENT;
        case GFXFormat.D24S8: return gl.DEPTH_STENCIL;
        case GFXFormat.D32F: return gl.DEPTH_COMPONENT;
        case GFXFormat.D32F_S8: return gl.DEPTH_STENCIL;

        case GFXFormat.BC1: return WebGLEXT.COMPRESSED_RGB_S3TC_DXT1_EXT;
        case GFXFormat.BC1_ALPHA: return WebGLEXT.COMPRESSED_RGBA_S3TC_DXT1_EXT;
        case GFXFormat.BC1_SRGB: return WebGLEXT.COMPRESSED_SRGB_S3TC_DXT1_EXT;
        case GFXFormat.BC1_SRGB_ALPHA: return WebGLEXT.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
        case GFXFormat.BC2: return WebGLEXT.COMPRESSED_RGBA_S3TC_DXT3_EXT;
        case GFXFormat.BC2_SRGB: return WebGLEXT.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
        case GFXFormat.BC3: return WebGLEXT.COMPRESSED_RGBA_S3TC_DXT5_EXT;
        case GFXFormat.BC3_SRGB: return WebGLEXT.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;

        case GFXFormat.ETC_RGB8: return WebGLEXT.COMPRESSED_RGB_ETC1_WEBGL;
        case GFXFormat.ETC2_RGB8: return WebGLEXT.COMPRESSED_RGB8_ETC2;
        case GFXFormat.ETC2_SRGB8: return WebGLEXT.COMPRESSED_SRGB8_ETC2;
        case GFXFormat.ETC2_RGB8_A1: return WebGLEXT.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2;
        case GFXFormat.ETC2_SRGB8_A1: return WebGLEXT.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2;
        case GFXFormat.ETC2_RGBA8: return WebGLEXT.COMPRESSED_RGBA8_ETC2_EAC;
        case GFXFormat.ETC2_SRGB8_A8: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC;
        case GFXFormat.EAC_R11: return WebGLEXT.COMPRESSED_R11_EAC;
        case GFXFormat.EAC_R11SN: return WebGLEXT.COMPRESSED_SIGNED_R11_EAC;
        case GFXFormat.EAC_RG11: return WebGLEXT.COMPRESSED_RG11_EAC;
        case GFXFormat.EAC_RG11SN: return WebGLEXT.COMPRESSED_SIGNED_RG11_EAC;

        case GFXFormat.PVRTC_RGB2: return WebGLEXT.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
        case GFXFormat.PVRTC_RGBA2: return WebGLEXT.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
        case GFXFormat.PVRTC_RGB4: return WebGLEXT.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        case GFXFormat.PVRTC_RGBA4: return WebGLEXT.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;

        case GFXFormat.ASTC_RGBA_4x4: return WebGLEXT.COMPRESSED_RGBA_ASTC_4x4_KHR;
        case GFXFormat.ASTC_RGBA_5x4: return WebGLEXT.COMPRESSED_RGBA_ASTC_5x4_KHR;
        case GFXFormat.ASTC_RGBA_5x5: return WebGLEXT.COMPRESSED_RGBA_ASTC_5x5_KHR;
        case GFXFormat.ASTC_RGBA_6x5: return WebGLEXT.COMPRESSED_RGBA_ASTC_6x5_KHR;
        case GFXFormat.ASTC_RGBA_6x6: return WebGLEXT.COMPRESSED_RGBA_ASTC_6x6_KHR;
        case GFXFormat.ASTC_RGBA_8x5: return WebGLEXT.COMPRESSED_RGBA_ASTC_8x5_KHR;
        case GFXFormat.ASTC_RGBA_8x6: return WebGLEXT.COMPRESSED_RGBA_ASTC_8x6_KHR;
        case GFXFormat.ASTC_RGBA_8x8: return WebGLEXT.COMPRESSED_RGBA_ASTC_8x8_KHR;
        case GFXFormat.ASTC_RGBA_10x5: return WebGLEXT.COMPRESSED_RGBA_ASTC_10x5_KHR;
        case GFXFormat.ASTC_RGBA_10x6: return WebGLEXT.COMPRESSED_RGBA_ASTC_10x6_KHR;
        case GFXFormat.ASTC_RGBA_10x8: return WebGLEXT.COMPRESSED_RGBA_ASTC_10x8_KHR;
        case GFXFormat.ASTC_RGBA_10x10: return WebGLEXT.COMPRESSED_RGBA_ASTC_10x10_KHR;
        case GFXFormat.ASTC_RGBA_12x10: return WebGLEXT.COMPRESSED_RGBA_ASTC_12x10_KHR;
        case GFXFormat.ASTC_RGBA_12x12: return WebGLEXT.COMPRESSED_RGBA_ASTC_12x12_KHR;

        case GFXFormat.ASTC_SRGBA_4x4: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR;
        case GFXFormat.ASTC_SRGBA_5x4: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR;
        case GFXFormat.ASTC_SRGBA_5x5: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR;
        case GFXFormat.ASTC_SRGBA_6x5: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR;
        case GFXFormat.ASTC_SRGBA_6x6: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR;
        case GFXFormat.ASTC_SRGBA_8x5: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR;
        case GFXFormat.ASTC_SRGBA_8x6: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR;
        case GFXFormat.ASTC_SRGBA_8x8: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR;
        case GFXFormat.ASTC_SRGBA_10x5: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR;
        case GFXFormat.ASTC_SRGBA_10x6: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR;
        case GFXFormat.ASTC_SRGBA_10x8: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR;
        case GFXFormat.ASTC_SRGBA_10x10: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR;
        case GFXFormat.ASTC_SRGBA_12x10: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR;
        case GFXFormat.ASTC_SRGBA_12x12: return WebGLEXT.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR;

        default: {
            console.error('Unsupported GFXFormat, convert to WebGL format failed.');
            return gl.RGBA;
        }
    }
}

function GFXTypeToWebGLType (type: GFXType, gl: WebGL2RenderingContext): GLenum {
    switch (type) {
        case GFXType.BOOL: return gl.BOOL;
        case GFXType.BOOL2: return gl.BOOL_VEC2;
        case GFXType.BOOL3: return gl.BOOL_VEC3;
        case GFXType.BOOL4: return gl.BOOL_VEC4;
        case GFXType.INT: return gl.INT;
        case GFXType.INT2: return gl.INT_VEC2;
        case GFXType.INT3: return gl.INT_VEC3;
        case GFXType.INT4: return gl.INT_VEC4;
        case GFXType.UINT: return gl.UNSIGNED_INT;
        case GFXType.FLOAT: return gl.FLOAT;
        case GFXType.FLOAT2: return gl.FLOAT_VEC2;
        case GFXType.FLOAT3: return gl.FLOAT_VEC3;
        case GFXType.FLOAT4: return gl.FLOAT_VEC4;
        case GFXType.MAT2: return gl.FLOAT_MAT2;
        case GFXType.MAT2X3: return gl.FLOAT_MAT2x3;
        case GFXType.MAT2X4: return gl.FLOAT_MAT2x4;
        case GFXType.MAT3X2: return gl.FLOAT_MAT3x2;
        case GFXType.MAT3: return gl.FLOAT_MAT3;
        case GFXType.MAT3X4: return gl.FLOAT_MAT3x4;
        case GFXType.MAT4X2: return gl.FLOAT_MAT4x2;
        case GFXType.MAT4X3: return gl.FLOAT_MAT4x3;
        case GFXType.MAT4: return gl.FLOAT_MAT4;
        case GFXType.SAMPLER2D: return gl.SAMPLER_2D;
        case GFXType.SAMPLER2D_ARRAY: return gl.SAMPLER_2D_ARRAY;
        case GFXType.SAMPLER3D: return gl.SAMPLER_3D;
        case GFXType.SAMPLER_CUBE: return gl.SAMPLER_CUBE;
        default: {
            console.error('Unsupported GLType, convert to GL type failed.');
            return GFXType.UNKNOWN;
        }
    }
}

function WebGLTypeToGFXType (glType: GLenum, gl: WebGL2RenderingContext): GFXType {
    switch (glType) {
        case gl.BOOL: return GFXType.BOOL;
        case gl.BOOL_VEC2: return GFXType.BOOL2;
        case gl.BOOL_VEC3: return GFXType.BOOL3;
        case gl.BOOL_VEC4: return GFXType.BOOL4;
        case gl.INT: return GFXType.INT;
        case gl.INT_VEC2: return GFXType.INT2;
        case gl.INT_VEC3: return GFXType.INT3;
        case gl.INT_VEC4: return GFXType.INT4;
        case gl.UNSIGNED_INT: return GFXType.UINT;
        case gl.UNSIGNED_INT_VEC2: return GFXType.UINT2;
        case gl.UNSIGNED_INT_VEC3: return GFXType.UINT3;
        case gl.UNSIGNED_INT_VEC4: return GFXType.UINT4;
        case gl.UNSIGNED_INT: return GFXType.UINT;
        case gl.FLOAT: return GFXType.FLOAT;
        case gl.FLOAT_VEC2: return GFXType.FLOAT2;
        case gl.FLOAT_VEC3: return GFXType.FLOAT3;
        case gl.FLOAT_VEC4: return GFXType.FLOAT4;
        case gl.FLOAT_MAT2: return GFXType.MAT2;
        case gl.FLOAT_MAT2x3: return GFXType.MAT2X3;
        case gl.FLOAT_MAT2x4: return GFXType.MAT2X4;
        case gl.FLOAT_MAT3x2: return GFXType.MAT3X2;
        case gl.FLOAT_MAT3: return GFXType.MAT3;
        case gl.FLOAT_MAT3x4: return GFXType.MAT3X4;
        case gl.FLOAT_MAT4x2: return GFXType.MAT4X2;
        case gl.FLOAT_MAT4x3: return GFXType.MAT4X3;
        case gl.FLOAT_MAT4: return GFXType.MAT4;
        case gl.SAMPLER_2D: return GFXType.SAMPLER2D;
        case gl.SAMPLER_2D_ARRAY: return GFXType.SAMPLER2D_ARRAY;
        case gl.SAMPLER_3D: return GFXType.SAMPLER3D;
        case gl.SAMPLER_CUBE: return GFXType.SAMPLER_CUBE;
        default: {
            console.error('Unsupported GLType, convert to GFXType failed.');
            return GFXType.UNKNOWN;
        }
    }
}

function WebGLGetTypeSize (glType: GLenum, gl: WebGL2RenderingContext): GFXType {
    switch (glType) {
        case gl.BOOL: return 4;
        case gl.BOOL_VEC2: return 8;
        case gl.BOOL_VEC3: return 12;
        case gl.BOOL_VEC4: return 16;
        case gl.INT: return 4;
        case gl.INT_VEC2: return 8;
        case gl.INT_VEC3: return 12;
        case gl.INT_VEC4: return 16;
        case gl.UNSIGNED_INT: return 4;
        case gl.UNSIGNED_INT_VEC2: return 8;
        case gl.UNSIGNED_INT_VEC3: return 12;
        case gl.UNSIGNED_INT_VEC4: return 16;
        case gl.FLOAT: return 4;
        case gl.FLOAT_VEC2: return 8;
        case gl.FLOAT_VEC3: return 12;
        case gl.FLOAT_VEC4: return 16;
        case gl.FLOAT_MAT2: return 16;
        case gl.FLOAT_MAT2x3: return 24;
        case gl.FLOAT_MAT2x4: return 32;
        case gl.FLOAT_MAT3x2: return 24;
        case gl.FLOAT_MAT3: return 36;
        case gl.FLOAT_MAT3x4: return 48;
        case gl.FLOAT_MAT4x2: return 32;
        case gl.FLOAT_MAT4x3: return 48;
        case gl.FLOAT_MAT4: return 64;
        case gl.SAMPLER_2D: return 4;
        case gl.SAMPLER_2D_ARRAY: return 4;
        case gl.SAMPLER_2D_ARRAY_SHADOW: return 4;
        case gl.SAMPLER_3D: return 4;
        case gl.SAMPLER_CUBE: return 4;
        case gl.INT_SAMPLER_2D: return 4;
        case gl.INT_SAMPLER_2D_ARRAY: return 4;
        case gl.INT_SAMPLER_3D: return 4;
        case gl.INT_SAMPLER_CUBE: return 4;
        case gl.UNSIGNED_INT_SAMPLER_2D: return 4;
        case gl.UNSIGNED_INT_SAMPLER_2D_ARRAY: return 4;
        case gl.UNSIGNED_INT_SAMPLER_3D: return 4;
        case gl.UNSIGNED_INT_SAMPLER_CUBE: return 4;
        default: {
            console.error('Unsupported GLType, get type failed.');
            return 0;
        }
    }
}

function WebGLGetComponentCount (glType: GLenum, gl: WebGL2RenderingContext): GFXType {
    switch (glType) {
        case gl.FLOAT_MAT2: return 2;
        case gl.FLOAT_MAT2x3: return 2;
        case gl.FLOAT_MAT2x4: return 2;
        case gl.FLOAT_MAT3x2: return 3;
        case gl.FLOAT_MAT3: return 3;
        case gl.FLOAT_MAT3x4: return 3;
        case gl.FLOAT_MAT4x2: return 4;
        case gl.FLOAT_MAT4x3: return 4;
        case gl.FLOAT_MAT4: return 4;
        default: {
            return 1;
        }
    }
}

const WebGLCmpFuncs: GLenum[] = [
    0x0200, // WebGLRenderingContext.NEVER,
    0x0201, // WebGLRenderingContext.LESS,
    0x0202, // WebGLRenderingContext.EQUAL,
    0x0203, // WebGLRenderingContext.LEQUAL,
    0x0204, // WebGLRenderingContext.GREATER,
    0x0205, // WebGLRenderingContext.NOTEQUAL,
    0x0206, // WebGLRenderingContext.GEQUAL,
    0x0207, // WebGLRenderingContext.ALWAYS,
];

const WebGLStencilOps: GLenum[] = [
    0x0000, // WebGLRenderingContext.ZERO,
    0x1E00, // WebGLRenderingContext.KEEP,
    0x1E01, // WebGLRenderingContext.REPLACE,
    0x1E02, // WebGLRenderingContext.INCR,
    0x1E03, // WebGLRenderingContext.DECR,
    0x150A, // WebGLRenderingContext.INVERT,
    0x8507, // WebGLRenderingContext.INCR_WRAP,
    0x8508, // WebGLRenderingContext.DECR_WRAP,
];

const WebGLBlendOps: GLenum[] = [
    0x8006, // WebGLRenderingContext.FUNC_ADD,
    0x800A, // WebGLRenderingContext.FUNC_SUBTRACT,
    0x800B, // WebGLRenderingContext.FUNC_REVERSE_SUBTRACT,
    0x8006, // WebGLRenderingContext.FUNC_ADD,
    0x8006, // WebGLRenderingContext.FUNC_ADD,
];

const WebGLBlendFactors: GLenum[] = [
    0x0000, // WebGLRenderingContext.ZERO,
    0x0001, // WebGLRenderingContext.ONE,
    0x0302, // WebGLRenderingContext.SRC_ALPHA,
    0x0304, // WebGLRenderingContext.DST_ALPHA,
    0x0303, // WebGLRenderingContext.ONE_MINUS_SRC_ALPHA,
    0x0305, // WebGLRenderingContext.ONE_MINUS_DST_ALPHA,
    0x0300, // WebGLRenderingContext.SRC_COLOR,
    0x0306, // WebGLRenderingContext.DST_COLOR,
    0x0301, // WebGLRenderingContext.ONE_MINUS_SRC_COLOR,
    0x0307, // WebGLRenderingContext.ONE_MINUS_DST_COLOR,
    0x0308, // WebGLRenderingContext.SRC_ALPHA_SATURATE,
    0x8001, // WebGLRenderingContext.CONSTANT_COLOR,
    0x8002, // WebGLRenderingContext.ONE_MINUS_CONSTANT_COLOR,
    0x8003, // WebGLRenderingContext.CONSTANT_ALPHA,
    0x8004, // WebGLRenderingContext.ONE_MINUS_CONSTANT_ALPHA,
];

export enum WebGL2Cmd {
    BEGIN_RENDER_PASS,
    END_RENDER_PASS,
    BIND_STATES,
    DRAW,
    UPDATE_BUFFER,
    COPY_BUFFER_TO_TEXTURE,
    COUNT,
}

export abstract class WebGL2CmdObject {
    public cmdType: WebGL2Cmd;
    public refCount: number = 0;

    constructor (type: WebGL2Cmd) {
        this.cmdType = type;
    }

    public abstract clear ();
}

export class WebGL2CmdBeginRenderPass extends WebGL2CmdObject {

    public gpuRenderPass: IWebGL2GPURenderPass | null = null;
    public gpuFramebuffer: IWebGL2GPUFramebuffer | null = null;
    public renderArea: GFXRect = { x: 0, y: 0, width: 0, height: 0 };
    public clearColors: GFXColor[] = [];
    public clearDepth: number = 1.0;
    public clearStencil: number = 0;

    constructor () {
        super(WebGL2Cmd.BEGIN_RENDER_PASS);
    }

    public clear () {
        this.gpuFramebuffer = null;
        this.clearColors.length = 0;
    }
}

export class WebGL2CmdBindStates extends WebGL2CmdObject {

    public gpuPipelineState: IWebGL2GPUPipelineState | null = null;
    public gpuInputAssembler: IWebGL2GPUInputAssembler | null = null;
    public gpuDescriptorSets: IWebGL2GPUDescriptorSet[] = [];
    public dynamicOffsets: number[] = [];
    public viewport: GFXViewport | null = null;
    public scissor: GFXRect | null = null;
    public lineWidth: number | null = null;
    public depthBias: IWebGL2DepthBias | null = null;
    public blendConstants: number[] = [];
    public depthBounds: IWebGL2DepthBounds | null = null;
    public stencilWriteMask: IWebGL2StencilWriteMask | null = null;
    public stencilCompareMask: IWebGL2StencilCompareMask | null = null;

    constructor () {
        super(WebGL2Cmd.BIND_STATES);
    }

    public clear () {
        this.gpuPipelineState = null;
        this.gpuInputAssembler = null;
        this.gpuDescriptorSets.length = 0;
        this.dynamicOffsets.length = 0;
        this.viewport = null;
        this.scissor = null;
        this.lineWidth = null;
        this.depthBias = null;
        this.blendConstants.length = 0;
        this.depthBounds = null;
        this.stencilWriteMask = null;
        this.stencilCompareMask = null;
    }
}

export class WebGL2CmdDraw extends WebGL2CmdObject {

    public drawInfo = new GFXDrawInfo();

    constructor () {
        super(WebGL2Cmd.DRAW);
    }

    public clear () {
    }
}

export class WebGL2CmdUpdateBuffer extends WebGL2CmdObject {

    public gpuBuffer: IWebGL2GPUBuffer | null = null;
    public buffer: GFXBufferSource | null = null;
    public offset: number = 0;
    public size: number = 0;

    constructor () {
        super(WebGL2Cmd.UPDATE_BUFFER);
    }

    public clear () {
        this.gpuBuffer = null;
        this.buffer = null;
    }
}

export class WebGL2CmdCopyBufferToTexture extends WebGL2CmdObject {

    public gpuTexture: IWebGL2GPUTexture | null = null;
    public buffers: ArrayBufferView[] = [];
    public regions: GFXBufferTextureCopy[] = [];

    constructor () {
        super(WebGL2Cmd.COPY_BUFFER_TO_TEXTURE);
    }

    public clear () {
        this.gpuTexture = null;
        this.buffers.length = 0;
        this.regions.length = 0;
    }
}

export class WebGL2CmdPackage {
    public cmds: CachedArray<WebGL2Cmd> = new CachedArray(1);
    public beginRenderPassCmds: CachedArray<WebGL2CmdBeginRenderPass> = new CachedArray(1);
    public bindStatesCmds: CachedArray<WebGL2CmdBindStates> = new CachedArray(1);
    public drawCmds: CachedArray<WebGL2CmdDraw> = new CachedArray(1);
    public updateBufferCmds: CachedArray<WebGL2CmdUpdateBuffer> = new CachedArray(1);
    public copyBufferToTextureCmds: CachedArray<WebGL2CmdCopyBufferToTexture> = new CachedArray(1);

    public clearCmds (allocator: WebGL2CommandAllocator) {

        if (this.beginRenderPassCmds.length) {
            allocator.beginRenderPassCmdPool.freeCmds(this.beginRenderPassCmds);
            this.beginRenderPassCmds.clear();
        }

        if (this.bindStatesCmds.length) {
            allocator.bindStatesCmdPool.freeCmds(this.bindStatesCmds);
            this.bindStatesCmds.clear();
        }

        if (this.drawCmds.length) {
            allocator.drawCmdPool.freeCmds(this.drawCmds);
            this.drawCmds.clear();
        }

        if (this.updateBufferCmds.length) {
            allocator.updateBufferCmdPool.freeCmds(this.updateBufferCmds);
            this.updateBufferCmds.clear();
        }

        if (this.copyBufferToTextureCmds.length) {
            allocator.copyBufferToTextureCmdPool.freeCmds(this.copyBufferToTextureCmds);
            this.copyBufferToTextureCmds.clear();
        }

        this.cmds.clear();
    }
}

export function WebGL2CmdFuncCreateBuffer (device: WebGL2Device, gpuBuffer: IWebGL2GPUBuffer) {

    const gl = device.gl;
    const cache = device.stateCache;
    const glUsage: GLenum = gpuBuffer.memUsage & GFXMemoryUsageBit.HOST ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

    if (gpuBuffer.usage & GFXBufferUsageBit.VERTEX) {

        gpuBuffer.glTarget = gl.ARRAY_BUFFER;
        const glBuffer = gl.createBuffer();

        if (glBuffer) {
            gpuBuffer.glBuffer = glBuffer;
            if (gpuBuffer.size > 0) {
                if (device.useVAO) {
                    if (cache.glVAO) {
                        gl.bindVertexArray(null);
                        cache.glVAO = gfxStateCache.gpuInputAssembler = null;
                    }
                }

                if (device.stateCache.glArrayBuffer !== gpuBuffer.glBuffer) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, gpuBuffer.glBuffer);
                    device.stateCache.glArrayBuffer = gpuBuffer.glBuffer;
                }

                gl.bufferData(gl.ARRAY_BUFFER, gpuBuffer.size, glUsage);

                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                device.stateCache.glArrayBuffer = null;
            }
        }
    } else if (gpuBuffer.usage & GFXBufferUsageBit.INDEX) {

        gpuBuffer.glTarget = gl.ELEMENT_ARRAY_BUFFER;
        const glBuffer = gl.createBuffer();
        if (glBuffer) {
            gpuBuffer.glBuffer = glBuffer;
            if (gpuBuffer.size > 0) {
                if (device.useVAO) {
                    if (cache.glVAO) {
                        gl.bindVertexArray(null);
                        cache.glVAO = gfxStateCache.gpuInputAssembler = null;
                    }
                }

                if (device.stateCache.glElementArrayBuffer !== gpuBuffer.glBuffer) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuBuffer.glBuffer);
                    device.stateCache.glElementArrayBuffer = gpuBuffer.glBuffer;
                }

                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gpuBuffer.size, glUsage);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                device.stateCache.glElementArrayBuffer = null;
            }
        }
    } else if (gpuBuffer.usage & GFXBufferUsageBit.UNIFORM) {

        gpuBuffer.glTarget = gl.UNIFORM_BUFFER;
        const glBuffer = gl.createBuffer();
        if (glBuffer && gpuBuffer.size > 0) {
            gpuBuffer.glBuffer = glBuffer;
            if (device.stateCache.glUniformBuffer !== gpuBuffer.glBuffer) {
                gl.bindBuffer(gl.UNIFORM_BUFFER, gpuBuffer.glBuffer);
                device.stateCache.glUniformBuffer = gpuBuffer.glBuffer;
            }

            gl.bufferData(gl.UNIFORM_BUFFER, gpuBuffer.size, glUsage);

            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            device.stateCache.glUniformBuffer = null;
        }
    } else if (gpuBuffer.usage & GFXBufferUsageBit.INDIRECT) {
        gpuBuffer.glTarget = gl.NONE;
    } else if (gpuBuffer.usage & GFXBufferUsageBit.TRANSFER_DST) {
        gpuBuffer.glTarget = gl.NONE;
    } else if (gpuBuffer.usage & GFXBufferUsageBit.TRANSFER_SRC) {
        gpuBuffer.glTarget = gl.NONE;
    } else {
        console.error('Unsupported GFXBufferType, create buffer failed.');
        gpuBuffer.glTarget = gl.NONE;
    }
}

export function WebGL2CmdFuncDestroyBuffer (device: WebGL2Device, gpuBuffer: IWebGL2GPUBuffer) {
    const gl = device.gl;
    if (gpuBuffer.glBuffer) {
        // Firefox 75+ implicitly unbind whatever buffer there was on the slot sometimes
        // can be reproduced in the static batching scene at https://github.com/cocos-creator/test-cases-3d
        switch (gpuBuffer.glTarget) {
            case gl.ARRAY_BUFFER:
                if (device.useVAO && device.stateCache.glVAO) {
                    gl.bindVertexArray(null);
                    device.stateCache.glVAO = gfxStateCache.gpuInputAssembler = null;
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                device.stateCache.glArrayBuffer = null;
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                if (device.useVAO && device.stateCache.glVAO) {
                    gl.bindVertexArray(null);
                    device.stateCache.glVAO = gfxStateCache.gpuInputAssembler = null;
                }
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                device.stateCache.glElementArrayBuffer = null;
                break;
            case gl.UNIFORM_BUFFER:
                gl.bindBuffer(gl.UNIFORM_BUFFER, null);
                device.stateCache.glUniformBuffer = null;
                break;
        }

        gl.deleteBuffer(gpuBuffer.glBuffer);
        gpuBuffer.glBuffer = null;
    }
}

export function WebGL2CmdFuncResizeBuffer (device: WebGL2Device, gpuBuffer: IWebGL2GPUBuffer) {

    const gl = device.gl;
    const cache = device.stateCache;
    const glUsage: GLenum = gpuBuffer.memUsage & GFXMemoryUsageBit.HOST ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

    if (gpuBuffer.usage & GFXBufferUsageBit.VERTEX) {
        if (device.useVAO) {
            if (cache.glVAO) {
                gl.bindVertexArray(null);
                cache.glVAO = gfxStateCache.gpuInputAssembler = null;
            }
        }

        if (cache.glArrayBuffer !== gpuBuffer.glBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, gpuBuffer.glBuffer);
        }

        if (gpuBuffer.buffer) {
            gl.bufferData(gl.ARRAY_BUFFER, gpuBuffer.buffer, glUsage);
        } else {
            gl.bufferData(gl.ARRAY_BUFFER, gpuBuffer.size, glUsage);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        cache.glArrayBuffer = null;
    } else if (gpuBuffer.usage & GFXBufferUsageBit.INDEX) {
        if (device.useVAO) {
            if (cache.glVAO) {
                gl.bindVertexArray(null);
                cache.glVAO = gfxStateCache.gpuInputAssembler = null;
            }
        }

        if (device.stateCache.glElementArrayBuffer !== gpuBuffer.glBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuBuffer.glBuffer);
        }

        if (gpuBuffer.buffer) {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gpuBuffer.buffer, glUsage);
        } else {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gpuBuffer.size, glUsage);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        device.stateCache.glElementArrayBuffer = null;
    } else if (gpuBuffer.usage & GFXBufferUsageBit.UNIFORM) {
        if (device.stateCache.glUniformBuffer !== gpuBuffer.glBuffer) {
            gl.bindBuffer(gl.UNIFORM_BUFFER, gpuBuffer.glBuffer);
        }

        gl.bufferData(gl.UNIFORM_BUFFER, gpuBuffer.size, glUsage);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        device.stateCache.glUniformBuffer = null;
    } else if ((gpuBuffer.usage & GFXBufferUsageBit.INDIRECT) ||
            (gpuBuffer.usage & GFXBufferUsageBit.TRANSFER_DST) ||
            (gpuBuffer.usage & GFXBufferUsageBit.TRANSFER_SRC)) {
        gpuBuffer.glTarget = gl.NONE;
    } else {
        console.error('Unsupported GFXBufferType, create buffer failed.');
        gpuBuffer.glTarget = gl.NONE;
    }
}

export function WebGL2CmdFuncUpdateBuffer (device: WebGL2Device, gpuBuffer: IWebGL2GPUBuffer, buffer: GFXBufferSource, offset: number, size: number) {

    if (gpuBuffer.usage & GFXBufferUsageBit.INDIRECT) {
        gpuBuffer.indirects.length = offset;
        Array.prototype.push.apply(gpuBuffer.indirects, (buffer as IGFXIndirectBuffer).drawInfos);
    } else {
        const buff = buffer as ArrayBuffer;
        const gl = device.gl;
        const cache = device.stateCache;

        switch (gpuBuffer.glTarget) {
            case gl.ARRAY_BUFFER: {
                if (cache.glVAO) {
                    gl.bindVertexArray(null);
                    cache.glVAO = gfxStateCache.gpuInputAssembler = null;
                }

                if (cache.glArrayBuffer !== gpuBuffer.glBuffer) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, gpuBuffer.glBuffer);
                    cache.glArrayBuffer = gpuBuffer.glBuffer;
                }

                if (size === buff.byteLength) {
                    gl.bufferSubData(gpuBuffer.glTarget, offset, buff);
                } else {
                    gl.bufferSubData(gpuBuffer.glTarget, offset, buff.slice(0, size));
                }
                break;
            }
            case gl.ELEMENT_ARRAY_BUFFER: {
                if (cache.glVAO) {
                    gl.bindVertexArray(null);
                    cache.glVAO = gfxStateCache.gpuInputAssembler = null;
                }

                if (cache.glElementArrayBuffer !== gpuBuffer.glBuffer) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuBuffer.glBuffer);
                    cache.glElementArrayBuffer = gpuBuffer.glBuffer;
                }

                if (size === buff.byteLength) {
                    gl.bufferSubData(gpuBuffer.glTarget, offset, buff);
                } else {
                    gl.bufferSubData(gpuBuffer.glTarget, offset, buff.slice(0, size));
                }
                break;
            }
            case gl.UNIFORM_BUFFER: {
                if (cache.glUniformBuffer !== gpuBuffer.glBuffer) {
                    gl.bindBuffer(gl.UNIFORM_BUFFER, gpuBuffer.glBuffer);
                    cache.glUniformBuffer = gpuBuffer.glBuffer;
                }

                if (size === buff.byteLength) {
                    gl.bufferSubData(gpuBuffer.glTarget, offset, buff);
                } else {
                    gl.bufferSubData(gpuBuffer.glTarget, offset, new Float32Array(buff, 0, size / 4));
                }
                break;
            }
            default: {
                console.error('Unsupported GFXBufferType, update buffer failed.');
                return;
            }
        }
    }
}

export function WebGL2CmdFuncCreateTexture (device: WebGL2Device, gpuTexture: IWebGL2GPUTexture) {

    const gl = device.gl;

    gpuTexture.glInternalFmt = GFXFormatToWebGLInternalFormat(gpuTexture.format, gl);
    gpuTexture.glFormat = GFXFormatToWebGLFormat(gpuTexture.format, gl);
    gpuTexture.glType = GFXFormatToWebGLType(gpuTexture.format, gl);

    let w = gpuTexture.width;
    let h = gpuTexture.height;

    switch (gpuTexture.type) {
        case GFXTextureType.TEX2D: {
            gpuTexture.glTarget = gl.TEXTURE_2D;

            const maxSize = Math.max(w, h);
            if (maxSize > device.maxTextureSize) {
                errorID(9100, maxSize, device.maxTextureSize);
            }

            if (gpuTexture.samples === GFXSampleCount.X1) {
                const glTexture = gl.createTexture();
                if (glTexture && gpuTexture.size > 0) {
                    gpuTexture.glTexture = glTexture;
                    const glTexUnit = device.stateCache.glTexUnits[device.stateCache.texUnit];

                    if (glTexUnit.glTexture !== gpuTexture.glTexture) {
                        gl.bindTexture(gl.TEXTURE_2D, gpuTexture.glTexture);
                        glTexUnit.glTexture = gpuTexture.glTexture;
                    }

                    if (!GFXFormatInfos[gpuTexture.format].isCompressed) {
                        for (let i = 0; i < gpuTexture.mipLevel; ++i) {
                            gl.texImage2D(gl.TEXTURE_2D, i, gpuTexture.glInternalFmt, w, h, 0, gpuTexture.glFormat, gpuTexture.glType, null);
                            w = Math.max(1, w >> 1);
                            h = Math.max(1, h >> 1);
                        }
                    } else {
                        if (gpuTexture.glInternalFmt !== WebGLEXT.COMPRESSED_RGB_ETC1_WEBGL) {
                            for (let i = 0; i < gpuTexture.mipLevel; ++i) {
                                const imgSize = GFXFormatSize(gpuTexture.format, w, h, 1);
                                const view: Uint8Array = new Uint8Array(imgSize);
                                gl.compressedTexImage2D(gl.TEXTURE_2D, i, gpuTexture.glInternalFmt, w, h, 0, view);
                                w = Math.max(1, w >> 1);
                                h = Math.max(1, h >> 1);
                            }
                        }
                        else {
                            // init 2 x 2 texture
                            const imgSize = GFXFormatSize(gpuTexture.format, 2, 2, 1);
                            const view: Uint8Array = new Uint8Array(imgSize);
                            gl.compressedTexImage2D(gl.TEXTURE_2D, 0, gpuTexture.glInternalFmt, 2, 2, 0, view);
                        }
                    }
                    /*
                    if (gpuTexture.isPowerOf2) {
                        gpuTexture.glWrapS = gl.REPEAT;
                        gpuTexture.glWrapT = gl.REPEAT;
                    } else {
                        gpuTexture.glWrapS = gl.CLAMP_TO_EDGE;
                        gpuTexture.glWrapT = gl.CLAMP_TO_EDGE;
                    }
                    gpuTexture.glMinFilter = gl.LINEAR;
                    gpuTexture.glMagFilter = gl.LINEAR;
                    gl.texParameteri(gpuTexture.glTarget, gl.TEXTURE_WRAP_S, gpuTexture.glWrapS);
                    gl.texParameteri(gpuTexture.glTarget, gl.TEXTURE_WRAP_T, gpuTexture.glWrapT);
                    gl.texParameteri(gpuTexture.glTarget, gl.TEXTURE_MIN_FILTER, gpuTexture.glMinFilter);
                    gl.texParameteri(gpuTexture.glTarget, gl.TEXTURE_MAG_FILTER, gpuTexture.glMagFilter);
                    */
                }
                else {
                    gl.deleteTexture(glTexture);
                }
            } else {
                const glRenderbuffer = gl.createRenderbuffer();
                if (glRenderbuffer && gpuTexture.size > 0) {
                    gpuTexture.glRenderbuffer = glRenderbuffer;
                    if (device.stateCache.glRenderbuffer !== gpuTexture.glRenderbuffer) {
                        gl.bindRenderbuffer(gl.RENDERBUFFER, gpuTexture.glRenderbuffer);
                        device.stateCache.glRenderbuffer = gpuTexture.glRenderbuffer;
                    }

                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, SAMPLES[gpuTexture.samples], gpuTexture.glInternalFmt, gpuTexture.width, gpuTexture.height);
                }
            }
            break;
        }
        case GFXTextureType.CUBE: {
            gpuTexture.glTarget = gl.TEXTURE_CUBE_MAP;

            const maxSize = Math.max(w, h);
            if (maxSize > device.maxCubeMapTextureSize) {
                errorID(9100, maxSize, device.maxTextureSize);
            }

            const glTexture = gl.createTexture();
            if (glTexture && gpuTexture.size > 0) {
                gpuTexture.glTexture = glTexture;
                const glTexUnit = device.stateCache.glTexUnits[device.stateCache.texUnit];

                if (glTexUnit.glTexture !== gpuTexture.glTexture) {
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, gpuTexture.glTexture);
                    glTexUnit.glTexture = gpuTexture.glTexture;
                }

                if (!GFXFormatInfos[gpuTexture.format].isCompressed) {
                    for (let f = 0; f < 6; ++f) {
                        w = gpuTexture.width;
                        h = gpuTexture.height;
                        for (let i = 0; i < gpuTexture.mipLevel; ++i) {
                            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, i, gpuTexture.glInternalFmt, w, h, 0, gpuTexture.glFormat, gpuTexture.glType, null);
                            w = Math.max(1, w >> 1);
                            h = Math.max(1, h >> 1);
                        }
                    }
                } else {
                    if (gpuTexture.glInternalFmt !== WebGLEXT.COMPRESSED_RGB_ETC1_WEBGL) {
                        for (let f = 0; f < 6; ++f) {
                            w = gpuTexture.width;
                            h = gpuTexture.height;
                            for (let i = 0; i < gpuTexture.mipLevel; ++i) {
                                const imgSize = GFXFormatSize(gpuTexture.format, w, h, 1);
                                const view: Uint8Array = new Uint8Array(imgSize);
                                gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, i, gpuTexture.glInternalFmt, w, h, 0, view);
                                w = Math.max(1, w >> 1);
                                h = Math.max(1, h >> 1);
                            }
                        }
                    }
                    else {
                        for (let f = 0; f < 6; ++f) {
                            const imgSize = GFXFormatSize(gpuTexture.format, 2, 2, 1);
                            const view: Uint8Array = new Uint8Array(imgSize);
                            gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, gpuTexture.glInternalFmt, 2, 2, 0, view);
                        }
                    }
                }

                /*
                if (gpuTexture.isPowerOf2) {
                    gpuTexture.glWrapS = gl.REPEAT;
                    gpuTexture.glWrapT = gl.REPEAT;
                } else {
                    gpuTexture.glWrapS = gl.CLAMP_TO_EDGE;
                    gpuTexture.glWrapT = gl.CLAMP_TO_EDGE;
                }
                gpuTexture.glMinFilter = gl.LINEAR;
                gpuTexture.glMagFilter = gl.LINEAR;

                gl.texParameteri(gpuTexture.glTarget, gl.TEXTURE_WRAP_S, gpuTexture.glWrapS);
                gl.texParameteri(gpuTexture.glTarget, gl.TEXTURE_WRAP_T, gpuTexture.glWrapT);
                gl.texParameteri(gpuTexture.glTarget, gl.TEXTURE_MIN_FILTER, gpuTexture.glMinFilter);
                gl.texParameteri(gpuTexture.glTarget, gl.TEXTURE_MAG_FILTER, gpuTexture.glMagFilter);
                */
            }
            break;
        }
        default: {
            console.error('Unsupported GFXTextureType, create texture failed.');
            gpuTexture.type = GFXTextureType.TEX2D;
            gpuTexture.glTarget = gl.TEXTURE_2D;
        }
    }
}

export function WebGL2CmdFuncDestroyTexture (device: WebGL2Device, gpuTexture: IWebGL2GPUTexture) {
    if (gpuTexture.glTexture) {
        device.gl.deleteTexture(gpuTexture.glTexture);
        gpuTexture.glTexture = null;
    }

    if (gpuTexture.glRenderbuffer) {
        device.gl.deleteRenderbuffer(gpuTexture.glRenderbuffer);
        gpuTexture.glRenderbuffer = null;
    }
}

export function WebGL2CmdFuncResizeTexture (device: WebGL2Device, gpuTexture: IWebGL2GPUTexture) {

    const gl = device.gl;

    gpuTexture.glInternalFmt = GFXFormatToWebGLInternalFormat(gpuTexture.format, gl);
    gpuTexture.glFormat = GFXFormatToWebGLFormat(gpuTexture.format, gl);
    gpuTexture.glType = GFXFormatToWebGLType(gpuTexture.format, gl);

    let w = gpuTexture.width;
    let h = gpuTexture.height;

    switch (gpuTexture.type) {
        case GFXTextureType.TEX2D: {
            gpuTexture.glTarget = gl.TEXTURE_2D;

            const maxSize = Math.max(w, h);
            if (maxSize > device.maxTextureSize) {
                errorID(9100, maxSize, device.maxTextureSize);
            }

            if (gpuTexture.samples === GFXSampleCount.X1) {
                const glTexUnit = device.stateCache.glTexUnits[device.stateCache.texUnit];

                if (glTexUnit.glTexture !== gpuTexture.glTexture) {
                    gl.bindTexture(gl.TEXTURE_2D, gpuTexture.glTexture);
                    glTexUnit.glTexture = gpuTexture.glTexture;
                }

                if (!GFXFormatInfos[gpuTexture.format].isCompressed) {
                    for (let i = 0; i < gpuTexture.mipLevel; ++i) {
                        gl.texImage2D(gl.TEXTURE_2D, i, gpuTexture.glInternalFmt, w, h, 0, gpuTexture.glFormat, gpuTexture.glType, null);
                        w = Math.max(1, w >> 1);
                        h = Math.max(1, h >> 1);
                    }
                } else {
                    if (gpuTexture.glInternalFmt !== WebGLEXT.COMPRESSED_RGB_ETC1_WEBGL) {
                        for (let i = 0; i < gpuTexture.mipLevel; ++i) {
                            const imgSize = GFXFormatSize(gpuTexture.format, w, h, 1);
                            const view: Uint8Array = new Uint8Array(imgSize);
                            gl.compressedTexImage2D(gl.TEXTURE_2D, i, gpuTexture.glInternalFmt, w, h, 0, view);
                            w = Math.max(1, w >> 1);
                            h = Math.max(1, h >> 1);
                        }
                    }
                }
            } else {
                const glRenderbuffer = gl.createRenderbuffer();
                if (glRenderbuffer && gpuTexture.size > 0) {
                    gpuTexture.glRenderbuffer = glRenderbuffer;
                    if (device.stateCache.glRenderbuffer !== gpuTexture.glRenderbuffer) {
                        gl.bindRenderbuffer(gl.RENDERBUFFER, gpuTexture.glRenderbuffer);
                        device.stateCache.glRenderbuffer = gpuTexture.glRenderbuffer;
                    }

                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, SAMPLES[gpuTexture.samples], gpuTexture.glInternalFmt, gpuTexture.width, gpuTexture.height);
                }
            }
            break;
        }
        case GFXTextureType.CUBE: {
            gpuTexture.type = GFXTextureType.CUBE;
            gpuTexture.glTarget = gl.TEXTURE_CUBE_MAP;

            const maxSize = Math.max(w, h);
            if (maxSize > device.maxCubeMapTextureSize) {
                errorID(9100, maxSize, device.maxTextureSize);
            }

            const glTexUnit = device.stateCache.glTexUnits[device.stateCache.texUnit];

            if (glTexUnit.glTexture !== gpuTexture.glTexture) {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, gpuTexture.glTexture);
                glTexUnit.glTexture = gpuTexture.glTexture;
            }

            if (!GFXFormatInfos[gpuTexture.format].isCompressed) {
                for (let f = 0; f < 6; ++f) {
                    w = gpuTexture.width;
                    h = gpuTexture.height;
                    for (let i = 0; i < gpuTexture.mipLevel; ++i) {
                        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, i, gpuTexture.glInternalFmt, w, h, 0, gpuTexture.glFormat, gpuTexture.glType, null);
                        w = Math.max(1, w >> 1);
                        h = Math.max(1, h >> 1);
                    }
                }
            } else {
                if (gpuTexture.glInternalFmt !== WebGLEXT.COMPRESSED_RGB_ETC1_WEBGL) {
                    for (let f = 0; f < 6; ++f) {
                        w = gpuTexture.width;
                        h = gpuTexture.height;
                        for (let i = 0; i < gpuTexture.mipLevel; ++i) {
                            const imgSize = GFXFormatSize(gpuTexture.format, w, h, 1);
                            const view: Uint8Array = new Uint8Array(imgSize);
                            gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, i, gpuTexture.glInternalFmt, w, h, 0, view);
                            w = Math.max(1, w >> 1);
                            h = Math.max(1, h >> 1);
                        }
                    }
                }
            }
            break;
        }
        default: {
            console.error('Unsupported GFXTextureType, create texture failed.');
            gpuTexture.type = GFXTextureType.TEX2D;
            gpuTexture.glTarget = gl.TEXTURE_2D;
        }
    }
}

export function WebGL2CmdFuncCreateSampler (device: WebGL2Device, gpuSampler: IWebGL2GPUSampler) {

    const gl = device.gl;
    const glSampler = gl.createSampler();
    if (glSampler) {
        if (gpuSampler.minFilter === GFXFilter.LINEAR || gpuSampler.minFilter === GFXFilter.ANISOTROPIC) {
            if (gpuSampler.mipFilter === GFXFilter.LINEAR || gpuSampler.mipFilter === GFXFilter.ANISOTROPIC) {
                gpuSampler.glMinFilter = gl.LINEAR_MIPMAP_LINEAR;
            } else if (gpuSampler.mipFilter === GFXFilter.POINT) {
                gpuSampler.glMinFilter = gl.LINEAR_MIPMAP_NEAREST;
            } else {
                gpuSampler.glMinFilter = gl.LINEAR;
            }
        } else {
            if (gpuSampler.mipFilter === GFXFilter.LINEAR || gpuSampler.mipFilter === GFXFilter.ANISOTROPIC) {
                gpuSampler.glMinFilter = gl.NEAREST_MIPMAP_LINEAR;
            } else if (gpuSampler.mipFilter === GFXFilter.POINT) {
                gpuSampler.glMinFilter = gl.NEAREST_MIPMAP_NEAREST;
            } else {
                gpuSampler.glMinFilter = gl.NEAREST;
            }
        }

        if (gpuSampler.magFilter === GFXFilter.LINEAR || gpuSampler.magFilter === GFXFilter.ANISOTROPIC) {
            gpuSampler.glMagFilter = gl.LINEAR;
        } else {
            gpuSampler.glMagFilter = gl.NEAREST;
        }

        gpuSampler.glWrapS = WebGLWraps[gpuSampler.addressU];
        gpuSampler.glWrapT = WebGLWraps[gpuSampler.addressV];
        gpuSampler.glWrapR = WebGLWraps[gpuSampler.addressW];

        gpuSampler.glSampler = glSampler;
        gl.samplerParameteri(glSampler, gl.TEXTURE_MIN_FILTER, gpuSampler.glMinFilter);
        gl.samplerParameteri(glSampler, gl.TEXTURE_MAG_FILTER, gpuSampler.glMagFilter);
        gl.samplerParameteri(glSampler, gl.TEXTURE_WRAP_S, gpuSampler.glWrapS);
        gl.samplerParameteri(glSampler, gl.TEXTURE_WRAP_T, gpuSampler.glWrapT);
        gl.samplerParameteri(glSampler, gl.TEXTURE_WRAP_R, gpuSampler.glWrapR);
        gl.samplerParameterf(glSampler, gl.TEXTURE_MIN_LOD, gpuSampler.minLOD);
        gl.samplerParameterf(glSampler, gl.TEXTURE_MAX_LOD, gpuSampler.maxLOD);
    }
}

export function WebGL2CmdFuncDestroySampler (device: WebGL2Device, gpuSampler: IWebGL2GPUSampler) {
    if (gpuSampler.glSampler) {
        device.gl.deleteSampler(gpuSampler.glSampler);
        gpuSampler.glSampler = null;
    }
}

export function WebGL2CmdFuncCreateFramebuffer (device: WebGL2Device, gpuFramebuffer: IWebGL2GPUFramebuffer) {
    if (!gpuFramebuffer.gpuColorTextures.length && !gpuFramebuffer.gpuDepthStencilTexture) { return; } // onscreen fbo

    const gl = device.gl;
    const attachments: GLenum[] = [];

    const glFramebuffer = gl.createFramebuffer();
    if (glFramebuffer) {
        gpuFramebuffer.glFramebuffer = glFramebuffer;

        if (device.stateCache.glFramebuffer !== gpuFramebuffer.glFramebuffer) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, gpuFramebuffer.glFramebuffer);
            device.stateCache.glFramebuffer = gpuFramebuffer.glFramebuffer;
        }

        for (let i = 0; i < gpuFramebuffer.gpuColorTextures.length; ++i) {

            const colorTexture = gpuFramebuffer.gpuColorTextures[i];
            if (colorTexture) {
                if (colorTexture.glTexture) {
                    gl.framebufferTexture2D(
                        gl.FRAMEBUFFER,
                        gl.COLOR_ATTACHMENT0 + i,
                        colorTexture.glTarget,
                        colorTexture.glTexture,
                        0); // level should be 0.
                } else {
                    gl.framebufferRenderbuffer(
                        gl.FRAMEBUFFER,
                        gl.COLOR_ATTACHMENT0 + i,
                        gl.RENDERBUFFER,
                        colorTexture.glRenderbuffer,
                    );
                }

                attachments.push(gl.COLOR_ATTACHMENT0 + i);
            }
        }

        const dst = gpuFramebuffer.gpuDepthStencilTexture;
        if (dst) {
            const glAttachment = GFXFormatInfos[dst.format].hasStencil ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;
            if (dst.glTexture) {
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    glAttachment,
                    dst.glTarget,
                    dst.glTexture,
                    0); // level must be 0
            } else {
                gl.framebufferRenderbuffer(
                    gl.FRAMEBUFFER,
                    glAttachment,
                    gl.RENDERBUFFER,
                    dst.glRenderbuffer,
                );
            }
        }

        gl.drawBuffers(attachments);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            switch (status) {
                case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: {
                    console.error('glCheckFramebufferStatus() - FRAMEBUFFER_INCOMPLETE_ATTACHMENT');
                    break;
                }
                case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: {
                    console.error('glCheckFramebufferStatus() - FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT');
                    break;
                }
                case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: {
                    console.error('glCheckFramebufferStatus() - FRAMEBUFFER_INCOMPLETE_DIMENSIONS');
                    break;
                }
                case gl.FRAMEBUFFER_UNSUPPORTED: {
                    console.error('glCheckFramebufferStatus() - FRAMEBUFFER_UNSUPPORTED');
                    break;
                }
                default:
            }
        }
    }
}

export function WebGL2CmdFuncDestroyFramebuffer (device: WebGL2Device, gpuFramebuffer: IWebGL2GPUFramebuffer) {
    if (gpuFramebuffer.glFramebuffer) {
        device.gl.deleteFramebuffer(gpuFramebuffer.glFramebuffer);
        gpuFramebuffer.glFramebuffer = null;
    }
}

export function WebGL2CmdFuncCreateShader (device: WebGL2Device, gpuShader: IWebGL2GPUShader) {
    const gl = device.gl;

    for (let k = 0; k < gpuShader.gpuStages.length; k++) {
        const gpuStage = gpuShader.gpuStages[k];

        let glShaderType: GLenum = 0;
        let shaderTypeStr = '';
        let lineNumber = 1;

        switch (gpuStage.type) {
            case GFXShaderStageFlagBit.VERTEX: {
                shaderTypeStr = 'VertexShader';
                glShaderType = gl.VERTEX_SHADER;
                break;
            }
            case GFXShaderStageFlagBit.FRAGMENT: {
                shaderTypeStr = 'FragmentShader';
                glShaderType = gl.FRAGMENT_SHADER;
                break;
            }
            default: {
                console.error('Unsupported GFXShaderType.');
                return;
            }
        }

        const glShader = gl.createShader(glShaderType);
        if (glShader) {
            gpuStage.glShader = glShader;
            gl.shaderSource(gpuStage.glShader, '#version 300 es\n' + gpuStage.source);
            gl.compileShader(gpuStage.glShader);

            if (!gl.getShaderParameter(gpuStage.glShader, gl.COMPILE_STATUS)) {
                console.error(shaderTypeStr + ' in \'' + gpuShader.name + '\' compilation failed.');
                console.error('Shader source dump:', gpuStage.source.replace(/^|\n/g, () => `\n${lineNumber++} `));
                console.error(gl.getShaderInfoLog(gpuStage.glShader));

                for (let l = 0; l < gpuShader.gpuStages.length; l++) {
                    const stage = gpuShader.gpuStages[k];
                    if (stage.glShader) {
                        gl.deleteShader(stage.glShader);
                        stage.glShader = null;
                    }
                }
                return;
            }
        }
    }

    const glProgram = gl.createProgram();
    if (!glProgram) {
        return;
    }

    gpuShader.glProgram = glProgram;

    // link program
    for (let k = 0; k < gpuShader.gpuStages.length; k++) {
        const gpuStage = gpuShader.gpuStages[k];
        gl.attachShader(gpuShader.glProgram, gpuStage.glShader!);
    }

    gl.linkProgram(gpuShader.glProgram);

    // detach & delete immediately
    for (let k = 0; k < gpuShader.gpuStages.length; k++) {
        const gpuStage = gpuShader.gpuStages[k];
        if (gpuStage.glShader) {
            gl.detachShader(gpuShader.glProgram, gpuStage.glShader);
            gl.deleteShader(gpuStage.glShader);
            gpuStage.glShader = null;
        }
    }

    if (gl.getProgramParameter(gpuShader.glProgram, gl.LINK_STATUS)) {
        console.info('Shader \'' + gpuShader.name + '\' compilation successed.');
    } else {
        console.error('Failed to link shader \'' + gpuShader.name + '\'.');
        console.error(gl.getProgramInfoLog(gpuShader.glProgram));
        return;
    }

    // parse inputs
    const activeAttribCount = gl.getProgramParameter(gpuShader.glProgram, gl.ACTIVE_ATTRIBUTES);
    gpuShader.glInputs = new Array<IWebGL2GPUInput>(activeAttribCount);

    for (let i = 0; i < activeAttribCount; ++i) {
        const attribInfo = gl.getActiveAttrib(gpuShader.glProgram, i);
        if (attribInfo) {
            let varName: string;
            const nameOffset = attribInfo.name.indexOf('[');
            if (nameOffset !== -1) {
                varName = attribInfo.name.substr(0, nameOffset);
            } else {
                varName = attribInfo.name;
            }

            const glLoc = gl.getAttribLocation(gpuShader.glProgram, varName);
            const type = WebGLTypeToGFXType(attribInfo.type, gl);
            const stride = WebGLGetTypeSize(attribInfo.type, gl);

            gpuShader.glInputs[i] = {
                name: varName,
                type,
                stride,
                count: attribInfo.size,
                size: stride * attribInfo.size,

                glType: attribInfo.type,
                glLoc,
            };
        }
    }

    // create uniform blocks
    const activeBlockCount = gl.getProgramParameter(gpuShader.glProgram, gl.ACTIVE_UNIFORM_BLOCKS);
    let blockName: string;
    let blockIdx: number;
    let blockSize: number;
    let block: GFXUniformBlock | null;

    if (activeBlockCount) {
        gpuShader.glBlocks = new Array<IWebGL2GPUUniformBlock>(activeBlockCount);

        for (let b = 0; b < activeBlockCount; ++b) {

            blockName = gl.getActiveUniformBlockName(gpuShader.glProgram, b)!;
            const nameOffset = blockName.indexOf('[');
            if (nameOffset !== -1) {
                blockName = blockName.substr(0, nameOffset);
            }

            // blockIdx = gl.getUniformBlockIndex(gpuShader.glProgram, blockName);
            block = null;
            for (let k = 0; k < gpuShader.blocks.length; k++) {
                if (gpuShader.blocks[k].name === blockName) {
                    block = gpuShader.blocks[k];
                    break;
                }
            }

            if (!block) {
                error(`Block '${blockName}' does not bound`);
            } else {
                // blockIdx = gl.getUniformBlockIndex(gpuShader.glProgram, blockName);
                blockIdx = b;
                blockSize = gl.getActiveUniformBlockParameter(gpuShader.glProgram, blockIdx, gl.UNIFORM_BLOCK_DATA_SIZE);
                const glBinding = block.binding + (device.bindingMappingInfo.bufferOffsets[block.set] || 0);

                gl.uniformBlockBinding(gpuShader.glProgram, blockIdx, glBinding);

                gpuShader.glBlocks[b] = {
                    set: block.set,
                    binding: block.binding,
                    idx: blockIdx,
                    name: blockName,
                    size: blockSize,
                    glBinding,
                };
            }
        }
    }

    // create uniform samplers
    if (gpuShader.samplers.length > 0) {
        gpuShader.glSamplers = new Array<IWebGL2GPUUniformSampler>(gpuShader.samplers.length);

        for (let i = 0; i < gpuShader.samplers.length; ++i) {
            const sampler = gpuShader.samplers[i];
            gpuShader.glSamplers[i] = {
                set: sampler.set,
                binding: sampler.binding,
                name: sampler.name,
                type: sampler.type,
                count: sampler.count,
                units: [],
                glType: GFXTypeToWebGLType(sampler.type, gl),
                glLoc: null!,
            };
        }
    }

    // texture unit index mapping optimization
    const glActiveSamplers: IWebGL2GPUUniformSampler[] = [];
    const glActiveSamplerLocations: WebGLUniformLocation[] = [];
    const bindingMappingInfo = device.bindingMappingInfo;
    const texUnitCacheMap = device.stateCache.texUnitCacheMap;

    let flexibleSetBaseOffset = 0;
    for (let i = 0; i < gpuShader.blocks.length; ++i) {
        if (gpuShader.blocks[i].set === bindingMappingInfo.flexibleSet) {
            flexibleSetBaseOffset++;
        }
    }

    let arrayOffset = 0;
    for (let i = 0; i < gpuShader.samplers.length; ++i) {
        const sampler = gpuShader.samplers[i];
        const glLoc = gl.getUniformLocation(gpuShader.glProgram, sampler.name);
        if (glLoc) {
            glActiveSamplers.push(gpuShader.glSamplers[i]);
            glActiveSamplerLocations.push(glLoc);
        }
        if (texUnitCacheMap[sampler.name] === undefined) {
            let binding = sampler.binding + bindingMappingInfo.samplerOffsets[sampler.set] + arrayOffset;
            if (sampler.set === bindingMappingInfo.flexibleSet) binding -= flexibleSetBaseOffset;
            texUnitCacheMap[sampler.name] = binding % device.maxTextureUnits;
            arrayOffset += sampler.count - 1;
        }
    }

    if (glActiveSamplers.length) {
        const usedTexUnits: boolean[] = [];
        // try to reuse existing mappings first
        for (let i = 0; i < glActiveSamplers.length; ++i) {
            const glSampler = glActiveSamplers[i];

            const cachedUnit = texUnitCacheMap[glSampler.name];
            if (cachedUnit !== undefined) {
                glSampler.glLoc = glActiveSamplerLocations[i];
                for (let t = 0, offset = 0; t < glSampler.count; ++t) {
                    while (usedTexUnits[cachedUnit + t + offset]) offset++;
                    glSampler.units.push(cachedUnit + t + offset);
                    usedTexUnits[cachedUnit + t + offset] = true;
                }
            }
        }
        // fill in the rest sequencially
        let unitIdx = 0;
        for (let i = 0; i < glActiveSamplers.length; ++i) {
            const glSampler = glActiveSamplers[i];

            if (!glSampler.glLoc) {
                glSampler.glLoc = glActiveSamplerLocations[i];
                while (usedTexUnits[unitIdx]) unitIdx++;
                for (let t = 0; t < glSampler.count; ++t) {
                    glSampler.units.push(unitIdx + t);
                    usedTexUnits[unitIdx + t] = true;
                }
                if (texUnitCacheMap[glSampler.name] === undefined) {
                    texUnitCacheMap[glSampler.name] = unitIdx;
                }
            }
        }

        if (device.stateCache.glProgram !== gpuShader.glProgram) {
            gl.useProgram(gpuShader.glProgram);
        }

        for (let k = 0; k < glActiveSamplers.length; k++) {
            const glSampler = glActiveSamplers[k];
            gl.uniform1iv(glSampler.glLoc, glSampler.units);
        }

        if (device.stateCache.glProgram !== gpuShader.glProgram) {
            gl.useProgram(device.stateCache.glProgram);
        }
    }

    gpuShader.glSamplers = glActiveSamplers;
}

export function WebGL2CmdFuncDestroyShader (device: WebGL2Device, gpuShader: IWebGL2GPUShader) {
    if (gpuShader.glProgram) {
        device.gl.deleteProgram(gpuShader.glProgram);
        gpuShader.glProgram = null;
    }
}

export function WebGL2CmdFuncCreateInputAssember (device: WebGL2Device, gpuInputAssembler: IWebGL2GPUInputAssembler) {

    const gl = device.gl;

    gpuInputAssembler.glAttribs = new Array<IWebGL2Attrib>(gpuInputAssembler.attributes.length);

    const offsets = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let i = 0; i < gpuInputAssembler.attributes.length; ++i) {
        const attrib = gpuInputAssembler.attributes[i];

        const stream = attrib.stream !== undefined ? attrib.stream : 0;
        // if (stream < gpuInputAssembler.gpuVertexBuffers.length) {

        const gpuBuffer = gpuInputAssembler.gpuVertexBuffers[stream];

        const glType = GFXFormatToWebGLType(attrib.format, gl);
        const size = GFXFormatInfos[attrib.format].size;

        gpuInputAssembler.glAttribs[i] = {
            name: attrib.name,
            glBuffer: gpuBuffer.glBuffer,
            glType,
            size,
            count: GFXFormatInfos[attrib.format].count,
            stride: gpuBuffer.stride,
            componentCount: WebGLGetComponentCount(glType, gl),
            isNormalized: (attrib.isNormalized !== undefined ? attrib.isNormalized : false),
            isInstanced: (attrib.isInstanced !== undefined ? attrib.isInstanced : false),
            offset: offsets[stream],
        };

        offsets[stream] += size;
    }
}

export function WebGL2CmdFuncDestroyInputAssembler (device: WebGL2Device, gpuInputAssembler: IWebGL2GPUInputAssembler) {
    const it = gpuInputAssembler.glVAOs.values();
    let res = it.next();
    while (!res.done) {
        device.gl.deleteVertexArray(res.value);
        res = it.next();
    }
    gpuInputAssembler.glVAOs.clear();
}

interface IWebGL2StateCache {
    gpuPipelineState: IWebGL2GPUPipelineState | null;
    gpuInputAssembler: IWebGL2GPUInputAssembler | null;
    reverseCW: boolean;
    glPrimitive: number;
    invalidateAttachments: GLenum[];
}
const gfxStateCache: IWebGL2StateCache = {
    gpuPipelineState: null,
    gpuInputAssembler: null,
    reverseCW: false,
    glPrimitive: 0,
    invalidateAttachments: [],
};

export function WebGL2CmdFuncBeginRenderPass (
    device: WebGL2Device,
    gpuRenderPass: IWebGL2GPURenderPass | null,
    gpuFramebuffer: IWebGL2GPUFramebuffer | null,
    renderArea: GFXRect,
    clearColors: GFXColor[],
    clearDepth: number,
    clearStencil: number) {

    const gl = device.gl;
    const cache = device.stateCache;

    let clears: GLbitfield = 0;

    if (gpuFramebuffer && gpuRenderPass) {
        if (cache.glFramebuffer !== gpuFramebuffer.glFramebuffer) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, gpuFramebuffer.glFramebuffer);
            cache.glFramebuffer = gpuFramebuffer.glFramebuffer;
            // render targets are drawn with flipped-Y
            const reverseCW = !!gpuFramebuffer.glFramebuffer;
            if (reverseCW !== gfxStateCache.reverseCW) {
                gfxStateCache.reverseCW = reverseCW;
                const isCCW = !device.stateCache.rs.isFrontFaceCCW;
                gl.frontFace(isCCW ? gl.CCW : gl.CW);
                device.stateCache.rs.isFrontFaceCCW = isCCW;
            }
        }

        if (cache.viewport.left !== renderArea.x ||
            cache.viewport.top !== renderArea.y ||
            cache.viewport.width !== renderArea.width ||
            cache.viewport.height !== renderArea.height) {

            gl.viewport(renderArea.x, renderArea.y, renderArea.width, renderArea.height);

            cache.viewport.left = renderArea.x;
            cache.viewport.top = renderArea.y;
            cache.viewport.width = renderArea.width;
            cache.viewport.height = renderArea.height;
        }

        if (cache.scissorRect.x !== renderArea.x ||
            cache.scissorRect.y !== renderArea.y ||
            cache.scissorRect.width !== renderArea.width ||
            cache.scissorRect.height !== renderArea.height) {

            gl.scissor(renderArea.x, renderArea.y, renderArea.width, renderArea.height);

            cache.scissorRect.x = renderArea.x;
            cache.scissorRect.y = renderArea.y;
            cache.scissorRect.width = renderArea.width;
            cache.scissorRect.height = renderArea.height;
        }

        gfxStateCache.invalidateAttachments.length = 0;

        for (let j = 0; j < clearColors.length; ++j) {
            const colorAttachment = gpuRenderPass.colorAttachments[j];

            if (colorAttachment.format !== GFXFormat.UNKNOWN) {
                switch (colorAttachment.loadOp) {
                    case GFXLoadOp.LOAD: break; // GL default behavior
                    case GFXLoadOp.CLEAR: {
                        if (cache.bs.targets[0].blendColorMask !== GFXColorMask.ALL) {
                            gl.colorMask(true, true, true, true);
                        }

                        if (!gpuFramebuffer.isOffscreen) {
                            const clearColor = clearColors[0];
                            gl.clearColor(clearColor.x, clearColor.y, clearColor.z, clearColor.w);
                            clears |= gl.COLOR_BUFFER_BIT;
                        } else {
                            _f32v4[0] = clearColors[j].x;
                            _f32v4[1] = clearColors[j].y;
                            _f32v4[2] = clearColors[j].z;
                            _f32v4[3] = clearColors[j].w;
                            gl.clearBufferfv(gl.COLOR, j, _f32v4);
                        }
                        break;
                    }
                    case GFXLoadOp.DISCARD: {
                        // invalidate the framebuffer
                        gfxStateCache.invalidateAttachments.push(gl.COLOR_ATTACHMENT0 + j);
                        break;
                    }
                    default:
                }
            }
        } // if (curGPURenderPass)

        if (gpuRenderPass.depthStencilAttachment) {

            if (gpuRenderPass.depthStencilAttachment.format !== GFXFormat.UNKNOWN) {
                switch (gpuRenderPass.depthStencilAttachment.depthLoadOp) {
                    case GFXLoadOp.LOAD: break; // GL default behavior
                    case GFXLoadOp.CLEAR: {
                        if (!cache.dss.depthWrite) {
                            gl.depthMask(true);
                        }

                        gl.clearDepth(clearDepth);

                        clears |= gl.DEPTH_BUFFER_BIT;
                        break;
                    }
                    case GFXLoadOp.DISCARD: {
                        // invalidate the framebuffer
                        gfxStateCache.invalidateAttachments.push(gl.DEPTH_ATTACHMENT);
                        break;
                    }
                    default:
                }

                if (GFXFormatInfos[gpuRenderPass.depthStencilAttachment.format].hasStencil) {
                    switch (gpuRenderPass.depthStencilAttachment.stencilLoadOp) {
                        case GFXLoadOp.LOAD: break; // GL default behavior
                        case GFXLoadOp.CLEAR: {
                            if (!cache.dss.stencilWriteMaskFront) {
                                gl.stencilMaskSeparate(gl.FRONT, 0xffff);
                            }

                            if (!cache.dss.stencilWriteMaskBack) {
                                gl.stencilMaskSeparate(gl.BACK, 0xffff);
                            }

                            gl.clearStencil(clearStencil);
                            clears |= gl.STENCIL_BUFFER_BIT;
                            break;
                        }
                        case GFXLoadOp.DISCARD: {
                            // invalidate the framebuffer
                            gfxStateCache.invalidateAttachments.push(gl.STENCIL_ATTACHMENT);
                            break;
                        }
                        default:
                    }
                }
            }
        } // if (curGPURenderPass.depthStencilAttachment)

        if (gpuFramebuffer.glFramebuffer && gfxStateCache.invalidateAttachments.length) {
            gl.invalidateFramebuffer(gl.FRAMEBUFFER, gfxStateCache.invalidateAttachments);
        }

        if (clears) {
            gl.clear(clears);
        }

        // restore states
        if (clears & gl.COLOR_BUFFER_BIT) {

            const colorMask = cache.bs.targets[0].blendColorMask;
            if (colorMask !== GFXColorMask.ALL) {
                const r = (colorMask & GFXColorMask.R) !== GFXColorMask.NONE;
                const g = (colorMask & GFXColorMask.G) !== GFXColorMask.NONE;
                const b = (colorMask & GFXColorMask.B) !== GFXColorMask.NONE;
                const a = (colorMask & GFXColorMask.A) !== GFXColorMask.NONE;
                gl.colorMask(r, g, b, a);
            }
        }

        if ((clears & gl.DEPTH_BUFFER_BIT) &&
            !cache.dss.depthWrite) {
            gl.depthMask(false);
        }

        if (clears & gl.STENCIL_BUFFER_BIT) {
            if (!cache.dss.stencilWriteMaskFront) {
                gl.stencilMaskSeparate(gl.FRONT, 0);
            }

            if (!cache.dss.stencilWriteMaskBack) {
                gl.stencilMaskSeparate(gl.BACK, 0);
            }
        }
    } // if (gpuFramebuffer)
}

export function WebGL2CmdFuncBindStates (
    device: WebGL2Device,
    gpuPipelineState: IWebGL2GPUPipelineState | null,
    gpuInputAssembler: IWebGL2GPUInputAssembler | null,
    gpuDescriptorSets: IWebGL2GPUDescriptorSet[],
    dynamicOffsets: number[],
    viewport: GFXViewport | null,
    scissor: GFXRect | null,
    lineWidth: number | null,
    depthBias: IWebGL2DepthBias | null,
    blendConstants: number[],
    depthBounds: IWebGL2DepthBounds | null,
    stencilWriteMask: IWebGL2StencilWriteMask | null,
    stencilCompareMask: IWebGL2StencilCompareMask | null) {

    const gl = device.gl;
    const cache = device.stateCache;
    const gpuShader = gpuPipelineState && gpuPipelineState.gpuShader;

    let isShaderChanged = false;

    // bind pipeline
    if (gpuPipelineState && gfxStateCache.gpuPipelineState !== gpuPipelineState) {
        gfxStateCache.gpuPipelineState = gpuPipelineState;
        gfxStateCache.glPrimitive = gpuPipelineState.glPrimitive;

        if (gpuShader) {

            const glProgram = gpuShader.glProgram;
            if (cache.glProgram !== glProgram) {
                gl.useProgram(glProgram);
                cache.glProgram = glProgram;
                isShaderChanged = true;
            }
        }

        // rasterizer state
        const rs = gpuPipelineState.rs;
        if (rs) {

            if (cache.rs.cullMode !== rs.cullMode) {
                switch (rs.cullMode) {
                    case GFXCullMode.NONE: {
                        gl.disable(gl.CULL_FACE);
                        break;
                    }
                    case GFXCullMode.FRONT: {
                        gl.enable(gl.CULL_FACE);
                        gl.cullFace(gl.FRONT);
                        break;
                    }
                    case GFXCullMode.BACK: {
                        gl.enable(gl.CULL_FACE);
                        gl.cullFace(gl.BACK);
                        break;
                    }
                    default:
                }

                device.stateCache.rs.cullMode = rs.cullMode;
            }

            const isFrontFaceCCW = rs.isFrontFaceCCW !== gfxStateCache.reverseCW; // boolean XOR
            if (device.stateCache.rs.isFrontFaceCCW !== isFrontFaceCCW) {
                gl.frontFace(isFrontFaceCCW ? gl.CCW : gl.CW);
                device.stateCache.rs.isFrontFaceCCW = isFrontFaceCCW;
            }

            if ((device.stateCache.rs.depthBias !== rs.depthBias) ||
                (device.stateCache.rs.depthBiasSlop !== rs.depthBiasSlop)) {
                gl.polygonOffset(rs.depthBias, rs.depthBiasSlop);
                device.stateCache.rs.depthBias = rs.depthBias;
                device.stateCache.rs.depthBiasSlop = rs.depthBiasSlop;
            }

            if (device.stateCache.rs.lineWidth !== rs.lineWidth) {
                gl.lineWidth(rs.lineWidth);
                device.stateCache.rs.lineWidth = rs.lineWidth;
            }

        } // rasterizater state

        // depth-stencil state
        const dss = gpuPipelineState.dss;
        if (dss) {

            if (cache.dss.depthTest !== dss.depthTest) {
                if (dss.depthTest) {
                    gl.enable(gl.DEPTH_TEST);
                } else {
                    gl.disable(gl.DEPTH_TEST);
                }
                cache.dss.depthTest = dss.depthTest;
            }

            if (cache.dss.depthWrite !== dss.depthWrite) {
                gl.depthMask(dss.depthWrite);
                cache.dss.depthWrite = dss.depthWrite;
            }

            if (cache.dss.depthFunc !== dss.depthFunc) {
                gl.depthFunc(WebGLCmpFuncs[dss.depthFunc]);
                cache.dss.depthFunc = dss.depthFunc;
            }

            // front
            if ((cache.dss.stencilTestFront !== dss.stencilTestFront) ||
                (cache.dss.stencilTestBack !== dss.stencilTestBack)) {
                if (dss.stencilTestFront || dss.stencilTestBack) {
                    gl.enable(gl.STENCIL_TEST);
                } else {
                    gl.disable(gl.STENCIL_TEST);
                }
                cache.dss.stencilTestFront = dss.stencilTestFront;
                cache.dss.stencilTestBack = dss.stencilTestBack;
            }

            if ((cache.dss.stencilFuncFront !== dss.stencilFuncFront) ||
                (cache.dss.stencilRefFront !== dss.stencilRefFront) ||
                (cache.dss.stencilReadMaskFront !== dss.stencilReadMaskFront)) {

                gl.stencilFuncSeparate(
                    gl.FRONT,
                    WebGLCmpFuncs[dss.stencilFuncFront],
                    dss.stencilRefFront,
                    dss.stencilReadMaskFront);

                cache.dss.stencilFuncFront = dss.stencilFuncFront;
                cache.dss.stencilRefFront = dss.stencilRefFront;
                cache.dss.stencilReadMaskFront = dss.stencilReadMaskFront;
            }

            if ((cache.dss.stencilFailOpFront !== dss.stencilFailOpFront) ||
                (cache.dss.stencilZFailOpFront !== dss.stencilZFailOpFront) ||
                (cache.dss.stencilPassOpFront !== dss.stencilPassOpFront)) {

                gl.stencilOpSeparate(
                    gl.FRONT,
                    WebGLStencilOps[dss.stencilFailOpFront],
                    WebGLStencilOps[dss.stencilZFailOpFront],
                    WebGLStencilOps[dss.stencilPassOpFront]);

                cache.dss.stencilFailOpFront = dss.stencilFailOpFront;
                cache.dss.stencilZFailOpFront = dss.stencilZFailOpFront;
                cache.dss.stencilPassOpFront = dss.stencilPassOpFront;
            }

            if (cache.dss.stencilWriteMaskFront !== dss.stencilWriteMaskFront) {
                gl.stencilMaskSeparate(gl.FRONT, dss.stencilWriteMaskFront);
                cache.dss.stencilWriteMaskFront = dss.stencilWriteMaskFront;
            }

            // back
            if ((cache.dss.stencilFuncBack !== dss.stencilFuncBack) ||
                (cache.dss.stencilRefBack !== dss.stencilRefBack) ||
                (cache.dss.stencilReadMaskBack !== dss.stencilReadMaskBack)) {

                gl.stencilFuncSeparate(
                    gl.BACK,
                    WebGLCmpFuncs[dss.stencilFuncBack],
                    dss.stencilRefBack,
                    dss.stencilReadMaskBack);

                cache.dss.stencilFuncBack = dss.stencilFuncBack;
                cache.dss.stencilRefBack = dss.stencilRefBack;
                cache.dss.stencilReadMaskBack = dss.stencilReadMaskBack;
            }

            if ((cache.dss.stencilFailOpBack !== dss.stencilFailOpBack) ||
                (cache.dss.stencilZFailOpBack !== dss.stencilZFailOpBack) ||
                (cache.dss.stencilPassOpBack !== dss.stencilPassOpBack)) {

                gl.stencilOpSeparate(
                    gl.BACK,
                    WebGLStencilOps[dss.stencilFailOpBack],
                    WebGLStencilOps[dss.stencilZFailOpBack],
                    WebGLStencilOps[dss.stencilPassOpBack]);

                cache.dss.stencilFailOpBack = dss.stencilFailOpBack;
                cache.dss.stencilZFailOpBack = dss.stencilZFailOpBack;
                cache.dss.stencilPassOpBack = dss.stencilPassOpBack;
            }

            if (cache.dss.stencilWriteMaskBack !== dss.stencilWriteMaskBack) {
                gl.stencilMaskSeparate(gl.BACK, dss.stencilWriteMaskBack);
                cache.dss.stencilWriteMaskBack = dss.stencilWriteMaskBack;
            }
        } // depth-stencil state

        // blend state
        const bs = gpuPipelineState.bs;
        if (bs) {

            if (cache.bs.isA2C !== bs.isA2C) {
                if (bs.isA2C) {
                    gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
                } else {
                    gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
                }
                cache.bs.isA2C = bs.isA2C;
            }

            if ((cache.bs.blendColor.x !== bs.blendColor.x) ||
                (cache.bs.blendColor.y !== bs.blendColor.y) ||
                (cache.bs.blendColor.z !== bs.blendColor.z) ||
                (cache.bs.blendColor.w !== bs.blendColor.w)) {

                gl.blendColor(bs.blendColor.x, bs.blendColor.y, bs.blendColor.z, bs.blendColor.w);

                cache.bs.blendColor.x = bs.blendColor.x;
                cache.bs.blendColor.y = bs.blendColor.y;
                cache.bs.blendColor.z = bs.blendColor.z;
                cache.bs.blendColor.w = bs.blendColor.w;
            }

            const target0 = bs.targets[0];
            const target0Cache = cache.bs.targets[0];

            if (target0Cache.blend !== target0.blend) {
                if (target0.blend) {
                    gl.enable(gl.BLEND);
                } else {
                    gl.disable(gl.BLEND);
                }
                target0Cache.blend = target0.blend;
            }

            if ((target0Cache.blendEq !== target0.blendEq) ||
                (target0Cache.blendAlphaEq !== target0.blendAlphaEq)) {

                gl.blendEquationSeparate(WebGLBlendOps[target0.blendEq], WebGLBlendOps[target0.blendAlphaEq]);
                target0Cache.blendEq = target0.blendEq;
                target0Cache.blendAlphaEq = target0.blendAlphaEq;
            }

            if ((target0Cache.blendSrc !== target0.blendSrc) ||
                (target0Cache.blendDst !== target0.blendDst) ||
                (target0Cache.blendSrcAlpha !== target0.blendSrcAlpha) ||
                (target0Cache.blendDstAlpha !== target0.blendDstAlpha)) {

                gl.blendFuncSeparate(
                    WebGLBlendFactors[target0.blendSrc],
                    WebGLBlendFactors[target0.blendDst],
                    WebGLBlendFactors[target0.blendSrcAlpha],
                    WebGLBlendFactors[target0.blendDstAlpha]);

                target0Cache.blendSrc = target0.blendSrc;
                target0Cache.blendDst = target0.blendDst;
                target0Cache.blendSrcAlpha = target0.blendSrcAlpha;
                target0Cache.blendDstAlpha = target0.blendDstAlpha;
            }

            if (target0Cache.blendColorMask !== target0.blendColorMask) {

                gl.colorMask(
                    (target0.blendColorMask & GFXColorMask.R) !== GFXColorMask.NONE,
                    (target0.blendColorMask & GFXColorMask.G) !== GFXColorMask.NONE,
                    (target0.blendColorMask & GFXColorMask.B) !== GFXColorMask.NONE,
                    (target0.blendColorMask & GFXColorMask.A) !== GFXColorMask.NONE);

                target0Cache.blendColorMask = target0.blendColorMask;
            }
        } // blend state
    } // bind pipeline

    // bind descriptor sets
    if (gpuPipelineState && gpuPipelineState.gpuPipelineLayout && gpuShader) {

        const blockLen = gpuShader.glBlocks.length;
        const dynamicOffsetIndices = gpuPipelineState.gpuPipelineLayout.dynamicOffsetIndices;

        for (let j = 0; j < blockLen; j++) {
            const glBlock = gpuShader.glBlocks[j];
            const gpuDescriptorSet = gpuDescriptorSets[glBlock.set];
            const gpuDescriptor = gpuDescriptorSet && gpuDescriptorSet.gpuDescriptors[glBlock.binding];

            if (!gpuDescriptor || !gpuDescriptor.gpuBuffer) {
                error(`Buffer binding '${glBlock.name}' at set ${glBlock.set} binding ${glBlock.binding} is not bounded`);
                continue;
            }

            const dynamicOffsetIndexSet = dynamicOffsetIndices[glBlock.set];
            const dynamicOffsetIndex = dynamicOffsetIndexSet && dynamicOffsetIndexSet[glBlock.binding];
            let offset = gpuDescriptor.gpuBuffer.glOffset;
            if (dynamicOffsetIndex >= 0) offset += dynamicOffsets[dynamicOffsetIndex];

            if (cache.glBindUBOs[glBlock.glBinding] !== gpuDescriptor.gpuBuffer.glBuffer ||
                cache.glBindUBOOffsets[glBlock.glBinding] !== offset) {
                gl.bindBufferRange(gl.UNIFORM_BUFFER, glBlock.glBinding, gpuDescriptor.gpuBuffer.glBuffer,
                    offset, gpuDescriptor.gpuBuffer.size);
                cache.glUniformBuffer = cache.glBindUBOs[glBlock.glBinding] = gpuDescriptor.gpuBuffer.glBuffer;
                cache.glBindUBOOffsets[glBlock.glBinding] = offset;
            }
        }

        const samplerLen = gpuShader.glSamplers.length;
        for (let i = 0; i < samplerLen; i++) {
            const glSampler = gpuShader.glSamplers[i];
            const gpuDescriptorSet = gpuDescriptorSets[glSampler.set];
            let descriptorIndex = gpuDescriptorSet && gpuDescriptorSet.descriptorIndices[glSampler.binding];
            let gpuDescriptor = gpuDescriptorSet && gpuDescriptorSet.gpuDescriptors[descriptorIndex];

            for (let l = 0; l < glSampler.units.length; l++) {
                const texUnit = glSampler.units[l];

                const glTexUnit = cache.glTexUnits[texUnit];

                if (!gpuDescriptor || !gpuDescriptor.gpuTexture || !gpuDescriptor.gpuSampler) {
                    error(`Sampler binding '${glSampler.name}' at set ${glSampler.set} binding ${glSampler.binding} index ${l} is not bounded`);
                    continue;
                }

                if (gpuDescriptor.gpuTexture &&
                    gpuDescriptor.gpuTexture.size > 0) {

                    const gpuTexture = gpuDescriptor.gpuTexture;
                    if (glTexUnit.glTexture !== gpuTexture.glTexture) {
                        if (cache.texUnit !== texUnit) {
                            gl.activeTexture(gl.TEXTURE0 + texUnit);
                            cache.texUnit = texUnit;
                        }
                        if (gpuTexture.glTexture) {
                            gl.bindTexture(gpuTexture.glTarget, gpuTexture.glTexture);
                        } else {
                            gl.bindTexture(gpuTexture.glTarget, device.nullTex2D!.gpuTexture.glTexture);
                        }
                        glTexUnit.glTexture = gpuTexture.glTexture;
                    }

                    const gpuSampler = gpuDescriptor.gpuSampler;
                    if (cache.glSamplerUnits[texUnit] !== gpuSampler.glSampler) {
                        gl.bindSampler(texUnit, gpuSampler.glSampler);
                        cache.glSamplerUnits[texUnit] = gpuSampler.glSampler;
                    }
                }

                gpuDescriptor = gpuDescriptorSet.gpuDescriptors[++descriptorIndex];
            }
        }
    } // bind descriptor sets

    // bind vertex/index buffer
    if (gpuInputAssembler && gpuShader &&
        (isShaderChanged || gfxStateCache.gpuInputAssembler !== gpuInputAssembler)) {
        gfxStateCache.gpuInputAssembler = gpuInputAssembler;

        if (device.useVAO) {
            // check vao
            let glVAO = gpuInputAssembler.glVAOs.get(gpuShader.glProgram!);
            if (!glVAO) {
                glVAO = gl.createVertexArray()!;
                gpuInputAssembler.glVAOs.set(gpuShader.glProgram!, glVAO);

                gl.bindVertexArray(glVAO);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                cache.glArrayBuffer = null;
                cache.glElementArrayBuffer = null;

                let glAttrib: IWebGL2Attrib | null;
                for (let j = 0; j < gpuShader.glInputs.length; j++) {
                    const glInput = gpuShader.glInputs[j];
                    glAttrib = null;

                    for (let k = 0; k < gpuInputAssembler.glAttribs.length; k++) {
                        const attrib = gpuInputAssembler.glAttribs[k];
                        if (attrib.name === glInput.name) {
                            glAttrib = attrib;
                            break;
                        }
                    }

                    if (glAttrib) {
                        if (cache.glArrayBuffer !== glAttrib.glBuffer) {
                            gl.bindBuffer(gl.ARRAY_BUFFER, glAttrib.glBuffer);
                            cache.glArrayBuffer = glAttrib.glBuffer;
                        }

                        for (let c = 0; c < glAttrib.componentCount; ++c) {
                            const glLoc = glInput.glLoc + c;
                            const attribOffset = glAttrib.offset + glAttrib.size * c;

                            gl.enableVertexAttribArray(glLoc);
                            cache.glCurrentAttribLocs[glLoc] = true;

                            gl.vertexAttribPointer(glLoc, glAttrib.count, glAttrib.glType, glAttrib.isNormalized, glAttrib.stride, attribOffset);
                            gl.vertexAttribDivisor(glLoc, glAttrib.isInstanced ? 1 : 0);
                        }
                    }
                }

                const gpuBuffer = gpuInputAssembler.gpuIndexBuffer;
                if (gpuBuffer) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuBuffer.glBuffer);
                }

                gl.bindVertexArray(null);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                cache.glArrayBuffer = null;
                cache.glElementArrayBuffer = null;
            }

            if (cache.glVAO !== glVAO) {
                gl.bindVertexArray(glVAO);
                cache.glVAO = glVAO;
            }
        } else {
            for (let a = 0; a < device.maxVertexAttributes; ++a) {
                cache.glCurrentAttribLocs[a] = false;
            }

            for (let j = 0; j < gpuShader.glInputs.length; j++) {
                const glInput = gpuShader.glInputs[j];
                let glAttrib: IWebGL2Attrib | null = null;

                for (let k = 0; k < gpuInputAssembler.glAttribs.length; k++) {
                    const attrib = gpuInputAssembler.glAttribs[k];
                    if (attrib.name === glInput.name) {
                        glAttrib = attrib;
                        break;
                    }
                }

                if (glAttrib) {
                    if (cache.glArrayBuffer !== glAttrib.glBuffer) {
                        gl.bindBuffer(gl.ARRAY_BUFFER, glAttrib.glBuffer);
                        cache.glArrayBuffer = glAttrib.glBuffer;
                    }

                    for (let c = 0; c < glAttrib.componentCount; ++c) {
                        const glLoc = glInput.glLoc + c;
                        const attribOffset = glAttrib.offset + glAttrib.size * c;

                        if (!cache.glEnabledAttribLocs[glLoc] && glLoc >= 0) {
                            gl.enableVertexAttribArray(glLoc);
                            cache.glEnabledAttribLocs[glLoc] = true;
                        }
                        cache.glCurrentAttribLocs[glLoc] = true;

                        gl.vertexAttribPointer(glLoc, glAttrib.count, glAttrib.glType, glAttrib.isNormalized, glAttrib.stride, attribOffset);
                        gl.vertexAttribDivisor(glLoc, glAttrib.isInstanced ? 1 : 0);
                    }
                }
            } // for

            const gpuBuffer = gpuInputAssembler.gpuIndexBuffer;
            if (gpuBuffer) {
                if (cache.glElementArrayBuffer !== gpuBuffer.glBuffer) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuBuffer.glBuffer);
                    cache.glElementArrayBuffer = gpuBuffer.glBuffer;
                }
            }

            for (let a = 0; a < device.maxVertexAttributes; ++a) {
                if (cache.glEnabledAttribLocs[a] !== cache.glCurrentAttribLocs[a]) {
                    gl.disableVertexAttribArray(a);
                    cache.glEnabledAttribLocs[a] = false;
                }
            }
        }
    } // bind vertex/index buffer

    if (gpuPipelineState) {
        for (let k = 0; k < gpuPipelineState.dynamicStates.length; k++) {
            const dynamicState = gpuPipelineState.dynamicStates[k];
            switch (dynamicState) {
                case GFXDynamicStateFlagBit.VIEWPORT: {
                    if (viewport) {
                        if (cache.viewport.left !== viewport.left ||
                            cache.viewport.top !== viewport.top ||
                            cache.viewport.width !== viewport.width ||
                            cache.viewport.height !== viewport.height) {

                            gl.viewport(viewport.left, viewport.top, viewport.width, viewport.height);

                            cache.viewport.left = viewport.left;
                            cache.viewport.top = viewport.top;
                            cache.viewport.width = viewport.width;
                            cache.viewport.height = viewport.height;
                        }
                    }
                    break;
                }
                case GFXDynamicStateFlagBit.SCISSOR: {
                    if (scissor) {
                        if (cache.scissorRect.x !== scissor.x ||
                            cache.scissorRect.y !== scissor.y ||
                            cache.scissorRect.width !== scissor.width ||
                            cache.scissorRect.height !== scissor.height) {

                            gl.scissor(scissor.x, scissor.y, scissor.width, scissor.height);

                            cache.scissorRect.x = scissor.x;
                            cache.scissorRect.y = scissor.y;
                            cache.scissorRect.width = scissor.width;
                            cache.scissorRect.height = scissor.height;
                        }
                    }
                    break;
                }
                case GFXDynamicStateFlagBit.LINE_WIDTH: {
                    if (lineWidth) {
                        if (cache.rs.lineWidth !== lineWidth) {
                            gl.lineWidth(lineWidth);
                            cache.rs.lineWidth = lineWidth;
                        }
                    }
                    break;
                }
                case GFXDynamicStateFlagBit.DEPTH_BIAS: {
                    if (depthBias) {

                        if ((cache.rs.depthBias !== depthBias.constantFactor) ||
                            (cache.rs.depthBiasSlop !== depthBias.slopeFactor)) {
                            gl.polygonOffset(depthBias.constantFactor, depthBias.slopeFactor);
                            cache.rs.depthBias = depthBias.constantFactor;
                            cache.rs.depthBiasSlop = depthBias.slopeFactor;
                        }
                    }
                    break;
                }
                case GFXDynamicStateFlagBit.BLEND_CONSTANTS: {
                    if ((cache.bs.blendColor.x !== blendConstants[0]) ||
                        (cache.bs.blendColor.y !== blendConstants[1]) ||
                        (cache.bs.blendColor.z !== blendConstants[2]) ||
                        (cache.bs.blendColor.w !== blendConstants[3])) {

                        gl.blendColor(blendConstants[0], blendConstants[1], blendConstants[2], blendConstants[3]);

                        cache.bs.blendColor.x = blendConstants[0];
                        cache.bs.blendColor.y = blendConstants[1];
                        cache.bs.blendColor.z = blendConstants[2];
                        cache.bs.blendColor.w = blendConstants[3];
                    }
                    break;
                }
                case GFXDynamicStateFlagBit.STENCIL_WRITE_MASK: {
                    if (stencilWriteMask) {
                        switch (stencilWriteMask.face) {
                            case GFXStencilFace.FRONT: {
                                if (cache.dss.stencilWriteMaskFront !== stencilWriteMask.writeMask) {
                                    gl.stencilMaskSeparate(gl.FRONT, stencilWriteMask.writeMask);
                                    cache.dss.stencilWriteMaskFront = stencilWriteMask.writeMask;
                                }
                                break;
                            }
                            case GFXStencilFace.BACK: {
                                if (cache.dss.stencilWriteMaskBack !== stencilWriteMask.writeMask) {
                                    gl.stencilMaskSeparate(gl.BACK, stencilWriteMask.writeMask);
                                    cache.dss.stencilWriteMaskBack = stencilWriteMask.writeMask;
                                }
                                break;
                            }
                            case GFXStencilFace.ALL: {
                                if (cache.dss.stencilWriteMaskFront !== stencilWriteMask.writeMask ||
                                    cache.dss.stencilWriteMaskBack !== stencilWriteMask.writeMask) {
                                    gl.stencilMask(stencilWriteMask.writeMask);
                                    cache.dss.stencilWriteMaskFront = stencilWriteMask.writeMask;
                                    cache.dss.stencilWriteMaskBack = stencilWriteMask.writeMask;
                                }
                                break;
                            }
                        }
                    }
                    break;
                }
                case GFXDynamicStateFlagBit.STENCIL_COMPARE_MASK: {
                    if (stencilCompareMask) {
                        switch (stencilCompareMask.face) {
                            case GFXStencilFace.FRONT: {
                                if (cache.dss.stencilRefFront !== stencilCompareMask.reference ||
                                    cache.dss.stencilReadMaskFront !== stencilCompareMask.compareMask) {
                                    gl.stencilFuncSeparate(
                                        gl.FRONT,
                                        WebGLCmpFuncs[cache.dss.stencilFuncFront],
                                        stencilCompareMask.reference,
                                        stencilCompareMask.compareMask);
                                    cache.dss.stencilRefFront = stencilCompareMask.reference;
                                    cache.dss.stencilReadMaskFront = stencilCompareMask.compareMask;
                                }
                                break;
                            }
                            case GFXStencilFace.BACK: {
                                if (cache.dss.stencilRefBack !== stencilCompareMask.reference ||
                                    cache.dss.stencilReadMaskBack !== stencilCompareMask.compareMask) {
                                    gl.stencilFuncSeparate(
                                        gl.BACK,
                                        WebGLCmpFuncs[cache.dss.stencilFuncBack],
                                        stencilCompareMask.reference,
                                        stencilCompareMask.compareMask);
                                    cache.dss.stencilRefBack = stencilCompareMask.reference;
                                    cache.dss.stencilReadMaskBack = stencilCompareMask.compareMask;
                                }
                                break;
                            }
                            case GFXStencilFace.ALL: {
                                if (cache.dss.stencilRefFront !== stencilCompareMask.reference ||
                                    cache.dss.stencilReadMaskFront !== stencilCompareMask.compareMask ||
                                    cache.dss.stencilRefBack !== stencilCompareMask.reference ||
                                    cache.dss.stencilReadMaskBack !== stencilCompareMask.compareMask) {
                                    gl.stencilFunc(
                                        WebGLCmpFuncs[cache.dss.stencilFuncBack],
                                        stencilCompareMask.reference,
                                        stencilCompareMask.compareMask);
                                    cache.dss.stencilRefFront = stencilCompareMask.reference;
                                    cache.dss.stencilReadMaskFront = stencilCompareMask.compareMask;
                                    cache.dss.stencilRefBack = stencilCompareMask.reference;
                                    cache.dss.stencilReadMaskBack = stencilCompareMask.compareMask;
                                }
                                break;
                            }
                        }
                    }
                    break;
                }
            } // switch
        } // for
    } // if
}

export function WebGL2CmdFuncDraw (device: WebGL2Device, drawInfo: GFXDrawInfo) {
    const gl = device.gl;
    const { gpuInputAssembler, glPrimitive } = gfxStateCache;

    if (gpuInputAssembler) {
        if (gpuInputAssembler.gpuIndirectBuffer) {
            const indirects = gpuInputAssembler.gpuIndirectBuffer.indirects;
            for (let k = 0; k < indirects.length; k++) {
                const subDrawInfo = indirects[k];
                const gpuBuffer = gpuInputAssembler.gpuIndexBuffer;
                if (subDrawInfo.instanceCount) {
                    if (gpuBuffer && subDrawInfo.indexCount > 0) {
                        const offset = subDrawInfo.firstIndex * gpuBuffer.stride;
                        gl.drawElementsInstanced(glPrimitive, subDrawInfo.indexCount,
                            gpuInputAssembler.glIndexType, offset, subDrawInfo.instanceCount);
                    } else {
                        gl.drawArraysInstanced(glPrimitive, subDrawInfo.firstVertex, subDrawInfo.vertexCount, subDrawInfo.instanceCount);
                    }
                } else {
                    if (gpuBuffer && subDrawInfo.indexCount > 0) {
                        const offset = subDrawInfo.firstIndex * gpuBuffer.stride;
                        gl.drawElements(glPrimitive, subDrawInfo.indexCount, gpuInputAssembler.glIndexType, offset);
                    } else {
                        gl.drawArrays(glPrimitive, subDrawInfo.firstVertex, subDrawInfo.vertexCount);
                    }
                }
            }
        } else {
            if (drawInfo.instanceCount) {
                if (gpuInputAssembler.gpuIndexBuffer && drawInfo.indexCount > 0) {
                    const offset = drawInfo.firstIndex * gpuInputAssembler.gpuIndexBuffer.stride;
                    gl.drawElementsInstanced(glPrimitive, drawInfo.indexCount,
                        gpuInputAssembler.glIndexType, offset, drawInfo.instanceCount);
                } else {
                    gl.drawArraysInstanced(glPrimitive, drawInfo.firstVertex, drawInfo.vertexCount, drawInfo.instanceCount);
                }
            } else {
                if (gpuInputAssembler.gpuIndexBuffer && drawInfo.indexCount > 0) {
                    const offset = drawInfo.firstIndex * gpuInputAssembler.gpuIndexBuffer.stride;
                    gl.drawElements(glPrimitive, drawInfo.indexCount, gpuInputAssembler.glIndexType, offset);
                } else {
                    gl.drawArrays(glPrimitive, drawInfo.firstVertex, drawInfo.vertexCount);
                }
            }
        }
    }
}

const cmdIds = new Array<number>(WebGL2Cmd.COUNT);
export function WebGL2CmdFuncExecuteCmds (device: WebGL2Device, cmdPackage: WebGL2CmdPackage) {
    cmdIds.fill(0);

    for (let i = 0; i < cmdPackage.cmds.length; ++i) {
        const cmd = cmdPackage.cmds.array[i];
        const cmdId = cmdIds[cmd]++;

        switch (cmd) {
            case WebGL2Cmd.BEGIN_RENDER_PASS: {
                const cmd0 = cmdPackage.beginRenderPassCmds.array[cmdId];
                WebGL2CmdFuncBeginRenderPass(device, cmd0.gpuRenderPass, cmd0.gpuFramebuffer, cmd0.renderArea,
                    cmd0.clearColors, cmd0.clearDepth, cmd0.clearStencil);
                break;
            }
            /*
            case WebGL2Cmd.END_RENDER_PASS: {
                // WebGL 2.0 doesn't support store operation of attachments.
                // GFXStoreOp.Store is the default GL behavior.
                break;
            }
            */
            case WebGL2Cmd.BIND_STATES: {
                const cmd2 = cmdPackage.bindStatesCmds.array[cmdId];
                WebGL2CmdFuncBindStates(device, cmd2.gpuPipelineState, cmd2.gpuInputAssembler, cmd2.gpuDescriptorSets, cmd2.dynamicOffsets,
                    cmd2.viewport, cmd2.scissor, cmd2.lineWidth, cmd2.depthBias, cmd2.blendConstants,
                    cmd2.depthBounds, cmd2.stencilWriteMask, cmd2.stencilCompareMask);
                break;
            }
            case WebGL2Cmd.DRAW: {
                const cmd3: WebGL2CmdDraw = cmdPackage.drawCmds.array[cmdId];
                WebGL2CmdFuncDraw(device, cmd3.drawInfo);
                break;
            }
            case WebGL2Cmd.UPDATE_BUFFER: {
                const cmd4 = cmdPackage.updateBufferCmds.array[cmdId];
                WebGL2CmdFuncUpdateBuffer(device, cmd4.gpuBuffer as IWebGL2GPUBuffer, cmd4.buffer as GFXBufferSource, cmd4.offset, cmd4.size);
                break;
            }
            case WebGL2Cmd.COPY_BUFFER_TO_TEXTURE: {
                const cmd5 = cmdPackage.copyBufferToTextureCmds.array[cmdId];
                WebGL2CmdFuncCopyBuffersToTexture(device, cmd5.buffers, cmd5.gpuTexture as IWebGL2GPUTexture, cmd5.regions);
                break;
            }
        } // switch
    } // for
}

export function WebGL2CmdFuncCopyTexImagesToTexture (
    device: WebGL2Device,
    texImages: TexImageSource[],
    gpuTexture: IWebGL2GPUTexture,
    regions: GFXBufferTextureCopy[]) {

    const gl = device.gl;
    const glTexUnit = device.stateCache.glTexUnits[device.stateCache.texUnit];
    if (glTexUnit.glTexture !== gpuTexture.glTexture) {
        gl.bindTexture(gpuTexture.glTarget, gpuTexture.glTexture);
        glTexUnit.glTexture = gpuTexture.glTexture;
    }

    let n = 0;
    let f = 0;

    switch (gpuTexture.glTarget) {
        case gl.TEXTURE_2D: {
            for (let k = 0; k < regions.length; k++) {
                const region = regions[k];
                gl.texSubImage2D(gl.TEXTURE_2D, region.texSubres.mipLevel,
                    region.texOffset.x, region.texOffset.y,
                    gpuTexture.glFormat, gpuTexture.glType, texImages[n++]);
            }
            break;
        }
        case gl.TEXTURE_CUBE_MAP: {
            for (let k = 0; k < regions.length; k++) {
                const region = regions[k];
                const fcount = region.texSubres.baseArrayLayer + region.texSubres.layerCount;
                for (f = region.texSubres.baseArrayLayer; f < fcount; ++f) {
                    gl.texSubImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, region.texSubres.mipLevel,
                        region.texOffset.x, region.texOffset.y,
                        gpuTexture.glFormat, gpuTexture.glType, texImages[n++]);
                }
            }
            break;
        }
        default: {
            console.error('Unsupported GL texture type, copy buffer to texture failed.');
        }
    }

    if (gpuTexture.flags & GFXTextureFlagBit.GEN_MIPMAP) {
        gl.generateMipmap(gpuTexture.glTarget);
    }
}

export function WebGL2CmdFuncCopyBuffersToTexture (
    device: WebGL2Device,
    buffers: ArrayBufferView[],
    gpuTexture: IWebGL2GPUTexture,
    regions: GFXBufferTextureCopy[]) {

    const gl = device.gl;
    const glTexUnit = device.stateCache.glTexUnits[device.stateCache.texUnit];
    if (glTexUnit.glTexture !== gpuTexture.glTexture) {
        gl.bindTexture(gpuTexture.glTarget, gpuTexture.glTexture);
        glTexUnit.glTexture = gpuTexture.glTexture;
    }

    let n = 0;
    let w = 1;
    let h = 1;
    let f = 0;
    const fmtInfo: GFXFormatInfo = GFXFormatInfos[gpuTexture.format];
    const isCompressed = fmtInfo.isCompressed;

    switch (gpuTexture.glTarget) {
        case gl.TEXTURE_2D: {
            for (let k = 0; k < regions.length; k++) {
                const region = regions[k];
                w = region.texExtent.width;
                h = region.texExtent.height;
                const pixels = buffers[n++];
                if (!isCompressed) {
                    gl.texSubImage2D(gl.TEXTURE_2D, region.texSubres.mipLevel,
                        region.texOffset.x, region.texOffset.y, w, h,
                        gpuTexture.glFormat, gpuTexture.glType, pixels);
                } else {
                    if (gpuTexture.glInternalFmt !== WebGLEXT.COMPRESSED_RGB_ETC1_WEBGL) {
                        gl.compressedTexSubImage2D(gl.TEXTURE_2D, region.texSubres.mipLevel,
                            region.texOffset.x, region.texOffset.y, w, h,
                            gpuTexture.glFormat, pixels);
                    } else {
                        gl.compressedTexImage2D(gl.TEXTURE_2D, region.texSubres.mipLevel,
                            gpuTexture.glInternalFmt, w, h, 0, pixels);
                    }
                }
            }
            break;
        }
        case gl.TEXTURE_CUBE_MAP: {
            for (let k = 0; k < regions.length; k++) {
                const region = regions[k];
                const fcount = region.texSubres.baseArrayLayer + region.texSubres.layerCount;
                for (f = region.texSubres.baseArrayLayer; f < fcount; ++f) {
                    w = region.texExtent.width;
                    h = region.texExtent.height;

                    const pixels = buffers[n++];

                    if (!isCompressed) {
                        gl.texSubImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, region.texSubres.mipLevel,
                            region.texOffset.x, region.texOffset.y, w, h,
                            gpuTexture.glFormat, gpuTexture.glType, pixels);
                    } else {
                        if (gpuTexture.glInternalFmt !== WebGLEXT.COMPRESSED_RGB_ETC1_WEBGL) {
                            gl.compressedTexSubImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, region.texSubres.mipLevel,
                                region.texOffset.x, region.texOffset.y, w, h,
                                gpuTexture.glFormat, pixels);
                        } else {
                            gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + f, region.texSubres.mipLevel,
                                gpuTexture.glInternalFmt, w, h, 0, pixels);
                        }
                    }
                }
            }
            break;
        }
        default: {
            console.error('Unsupported GL texture type, copy buffer to texture failed.');
        }
    }

    if (gpuTexture.flags & GFXTextureFlagBit.GEN_MIPMAP) {
        gl.generateMipmap(gpuTexture.glTarget);
    }
}

export function WebGL2CmdFuncBlitFramebuffer (
    device: WebGL2Device,
    src: IWebGL2GPUFramebuffer,
    dst: IWebGL2GPUFramebuffer,
    srcRect: GFXRect,
    dstRect: GFXRect,
    filter: GFXFilter) {
    const gl = device.gl;

    if (device.stateCache.glReadFramebuffer !== src.glFramebuffer) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, src.glFramebuffer);
        device.stateCache.glReadFramebuffer = src.glFramebuffer;
    }

    const rebindFBO = (dst.glFramebuffer !== device.stateCache.glFramebuffer);
    if (rebindFBO) {
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dst.glFramebuffer);
    }

    let mask = 0;
    if (src.gpuColorTextures.length > 0) {
        mask |= gl.COLOR_BUFFER_BIT;
    }

    if (src.gpuDepthStencilTexture) {
        mask |= gl.DEPTH_BUFFER_BIT;
        if (GFXFormatInfos[src.gpuDepthStencilTexture.format].hasStencil) {
            mask |= gl.STENCIL_BUFFER_BIT;
        }
    }

    const glFilter = (filter === GFXFilter.LINEAR || filter === GFXFilter.ANISOTROPIC) ? gl.LINEAR : gl.NEAREST;

    gl.blitFramebuffer(
        srcRect.x, srcRect.y, srcRect.x + srcRect.width, srcRect.y + srcRect.height,
        dstRect.x, dstRect.y, dstRect.x + dstRect.width, dstRect.y + dstRect.height,
        mask, glFilter);

    if (rebindFBO) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, device.stateCache.glFramebuffer);
    }
}
