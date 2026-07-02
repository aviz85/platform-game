// Draws a named animation from an art module's build() result.
// Art result: { image, anims: { name: { frames:[{x,y,w,h}], fps, loop } }, anchor:{x,y} }
export function drawAnim(ctx, art, animName, t, x, y, flip = false, alpha = 1) {
  if (!art || !art.anims) return;
  const anim = art.anims[animName] || art.anims[Object.keys(art.anims)[0]];
  if (!anim || !anim.frames || !anim.frames.length) return;
  let idx = Math.floor(t * (anim.fps || 8));
  idx = anim.loop === false ? Math.min(idx, anim.frames.length - 1) : idx % anim.frames.length;
  const f = anim.frames[idx];
  const ax = art.anchor ? art.anchor.x : f.w / 2;
  const ay = art.anchor ? art.anchor.y : f.h;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(art.image, f.x, f.y, f.w, f.h, Math.round(-ax), Math.round(-ay), f.w, f.h);
  ctx.restore();
}

export function animLength(art, animName) {
  const anim = art && art.anims && art.anims[animName];
  if (!anim) return 0.3;
  return anim.frames.length / (anim.fps || 8);
}
