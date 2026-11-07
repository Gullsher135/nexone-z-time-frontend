// NexoneZ Time is a product of NexoneZ Software House. These two small pieces show that relationship everywhere.

// The product mark: the NexoneZ Time icon with its name.
export function TimeBrand({ sub = 'Attendance', showName = true }) {
  return (
    <div className="brand">
      <img className="brand-time" src="/time-icon.svg" alt="NexoneZ Time" />
      {showName && (
        <div>
          NexoneZ Time
          {sub && <small>{sub}</small>}
        </div>
      )}
    </div>
  );
}

// "A product of [NexoneZ icon] NexoneZ Software House"
export function ProductOf({ className = '' }) {
  return (
    <div className={`product-of ${className}`}>
      <img src="/nexonez-icon.png" alt="" />
      <span>
        A product of
        <b>NexoneZ Software House</b>
      </span>
    </div>
  );
}
