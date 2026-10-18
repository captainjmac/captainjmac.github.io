"""Bake the portrait's light maps for the WebGL scene (assets/js/retro-scene.js).

The portrait art is lit by just two lights: a pink key from the left and a
blue fill. Every pixel is (to within ~2/255) some amount of one plus some
amount of the other, added in linear light. This unmixes the two so the
scene can relight the portrait with any colours, and adds a relief map so
new lights can pick out the linework.

Output RGBA:
  R  key light amount (gamma 2.2 encoded, so the darks keep their precision)
  G  fill light amount (gamma 2.2 encoded)
  B  relief height: the artwork's luminance, lightly blurred
  A  the cutout's alpha

It prints the two light colours (linear RGB) that reproduce the original;
those go in KEY_COLOR and FILL_COLOR in retro-scene.js.

Usage (needs numpy, pillow, scipy):
  python3 _tools/portrait-maps.py assets/img/jmac-scary-cutout.png assets/img/jmac-portrait-light.png
"""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float64) / 255
rgb, alpha = im[..., :3], im[..., 3]


def to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


lin = to_linear(rgb)
opaque = lin[alpha > 0.98]

# Non-negative two-component factorisation, seeded from the pinkest and the
# bluest of the bright pixels.
srgb_opaque = rgb[alpha > 0.98]
ratio = srgb_opaque[:, 0] / (srgb_opaque[:, 2] + 1e-3)
lum = srgb_opaque.sum(1)
bright = lum > np.percentile(lum, 90)
basis = np.stack([opaque[bright & (ratio > 2)].mean(0), opaque[bright & (ratio < 0.6)].mean(0)])
for _ in range(80):
    weights = np.clip(opaque @ np.linalg.pinv(basis), 0, None)
    basis = np.clip(np.linalg.lstsq(weights, opaque, rcond=None)[0], 0, None)

# Weights for every pixel, scaled so each light's brightest pixel is 1.
weights = np.clip(lin.reshape(-1, 3) @ np.linalg.pinv(basis), 0, None).reshape(*alpha.shape, 2)
scale = weights[alpha > 0.5].max(axis=0)
weights /= scale
basis *= scale[:, None]

height = gaussian_filter(rgb @ np.array([0.299, 0.587, 0.114]), 1.0)
height /= height.max()

out = np.dstack([weights[..., 0] ** (1 / 2.2), weights[..., 1] ** (1 / 2.2), height, alpha])
out[alpha == 0] = 0
Image.fromarray(np.round(np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGBA').save(dst, optimize=True)

recon = np.clip(weights @ basis, 0, 1)
err = np.where(recon <= 0.0031308, recon * 12.92, 1.055 * recon ** (1 / 2.4) - 0.055) - rgb
print('rms error (0-255):', np.sqrt((err[alpha > 0.98] ** 2).mean()) * 255)
print('KEY_COLOR  (linear):', ', '.join(f'{v:.4f}' for v in basis[0]))
print('FILL_COLOR (linear):', ', '.join(f'{v:.4f}' for v in basis[1]))
