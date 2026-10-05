export function ratingSummary(reviews=[], fallbackRating=null){
  const valid=(Array.isArray(reviews)?reviews:[])
    .map(r=>Number(r?.rating))
    .filter(n=>Number.isFinite(n)&&n>=1&&n<=5);
  if(valid.length){
    const average=valid.reduce((a,b)=>a+b,0)/valid.length;
    return {average,count:valid.length};
  }
  const fallback=Number(fallbackRating);
  if(Number.isFinite(fallback)&&fallback>=1&&fallback<=5){
    return {average:fallback,count:0};
  }
  return {average:0,count:0};
}

export default function RatingStars({reviews=[],rating=null,compact=false}){
  const {average,count}=ratingSummary(reviews,rating);
  if(!average) return null;
  const filled=Math.round(average);
  return <div className={compact?"ratingStars compact":"ratingStars"} aria-label={`${average.toFixed(1)} out of 5 stars`}>
    <span className="ratingFilled">{"★".repeat(filled)}</span>
    <span className="ratingEmpty">{"★".repeat(Math.max(0,5-filled))}</span>
    <strong>{average.toFixed(1)}</strong>
    {count>0 ? <em>{count} review{count===1?"":"s"}</em> : null}
  </div>;
}
