import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createHouse, uploadHouseImage } from "../api/houses";
import { getErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import { getMySubscription } from "../api/subscription";

// These integers are the Domain enums. If any of them is renumbered,
// these lists have to change with it.
const PROPERTY_TYPES = [
  { value: 1, label: "Apartment" },
  { value: 2, label: "House" },
  { value: 3, label: "Villa" },
  { value: 4, label: "Studio" },
  { value: 5, label: "Room" },
];

const PRICE_UNITS = [
  { value: 1, label: "Weekly" },
  { value: 2, label: "Monthly" },
  { value: 3, label: "Yearly" },
];

const BUILDING_AGES = [
  { value: "", label: "Not specified" },
  { value: 1, label: "Under one year" },
  { value: 2, label: "One to five years" },
  { value: 3, label: "Five to ten years" },
  { value: 4, label: "Ten to twenty years" },
  { value: 5, label: "Over twenty years" },
];

const CITIES = ["Amman", "Irbid", "Zarqa", "Aqaba", "Salt", "Madaba", "Jerash", "Karak"];

const EMPTY = {
  title: "",
  description: "",
  propertyType: 1,
  address: "",
  city: "Amman",
  neighborhood: "",
  price: "",
  priceUnit: 2,
  bedrooms: 1,
  bathrooms: 1,
  areaSqM: "",
  isFurnished: false,
  floorNumber: "",
  masterBedrooms: "",
  apartmentsInBuilding: "",
  buildingAge: "",
  turnoverDays: 2,
};

/** "" for an optional number means "not provided", which the API wants as null. */
const optionalNumber = (v) => (v === "" ? null : Number(v));

export default function CreateListing() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  // { file, preview } — nothing is uploaded until the listing exists, so an
  // abandoned form leaves nothing on the server.
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sub, setSub] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    getMySubscription()
      .then((s) => { if (!cancelled) setSub(s); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Every createObjectURL holds a blob in memory until it is revoked.
  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.preview));
  }, [photos]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";                          // so the same file can be picked again
    if (files.length === 0) return;

    setPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function removePhoto(preview) {
    setPhotos((prev) => prev.filter((p) => p.preview !== preview));
    URL.revokeObjectURL(preview);
  }

  function makePrimary(preview) {
    setPhotos((prev) => [
      ...prev.filter((p) => p.preview === preview),
      ...prev.filter((p) => p.preview !== preview),
    ]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const created = await createHouse({
        title: form.title.trim(),
        description: form.description.trim(),
        propertyType: Number(form.propertyType),
        address: form.address.trim(),
        city: form.city.trim(),
        neighborhood: form.neighborhood.trim() || null,
        price: Number(form.price),
        priceUnit: Number(form.priceUnit),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        areaSqM: Number(form.areaSqM),
        isFurnished: form.isFurnished,
        floorNumber: optionalNumber(form.floorNumber),
        masterBedrooms: optionalNumber(form.masterBedrooms),
        apartmentsInBuilding: optionalNumber(form.apartmentsInBuilding),
        buildingAge: optionalNumber(form.buildingAge),
        turnoverDays: Number(form.turnoverDays),
        imageUrls: [],
      });

      // Photos go up after the listing exists, so each one has a house folder
      // to live in. Sequential, so the order chosen is the order stored and the
      // first upload becomes the main photo.
      for (const { file } of photos) {
        try {
          await uploadHouseImage(created.id, file);
        } catch {
          // The listing is already saved; a failed photo should not lose it.
          setError(`The listing was published, but ${file.name} could not be uploaded.`);
        }
      }

      toast.success("Listing created. It is pending review before renters can see it.");
      navigate(`/houses/${created.id}`, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, "Could not create the listing.");
      setError(message);
      toast.error(message);
      setBusy(false);
    }
  }

  return (
    <div className="container section">
      <h1 className="page-title">List a property</h1>
      <p className="muted page-sub">
        An administrator reviews every listing before renters can see it. You can
        follow its status on <Link to="/my-listings">My listings</Link>.
      </p>

      {/* The API refuses without a subscription, so say so before the form is
          filled in rather than after it is submitted. */}
      {sub && !sub.isActive && (
        <div className="sub-status">
          <span className="badge badge-rejected">Not active</span>
          <p className="muted">
            Publishing needs an active subscription — {sub.pricePerMonth} JOD a
            month. <Link to="/subscribe">Subscribe</Link>.
          </p>
        </div>
      )}

      <form className="listing-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="error-text">{error}</p>}

        <fieldset className="form-block">
          <legend>The property</legend>

          <div className="field">
            <label className="label" htmlFor="title">Title</label>
            <input
              id="title" className="input" maxLength={150} required
              placeholder="Bright 3-bedroom in Abdoun"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description" className="input" rows={4} maxLength={2000} required
              placeholder="What makes this place worth renting? Nearby streets, recent work, what is included."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="propertyType">Property type</label>
              <select
                id="propertyType" className="input"
                value={form.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="buildingAge">Building age</label>
              <select
                id="buildingAge" className="input"
                value={form.buildingAge}
                onChange={(e) => set("buildingAge", e.target.value)}
              >
                {BUILDING_AGES.map((a) => (
                  <option key={a.label} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend>Where it is</legend>

          <div className="field">
            <label className="label" htmlFor="address">Address</label>
            <input
              id="address" className="input" maxLength={250} required
              placeholder="Abdoun Circle, Building 12"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="city">City</label>
              <select
                id="city" className="input"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              >
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="neighborhood">Neighbourhood <span className="optional">optional</span></label>
              <input
                id="neighborhood" className="input" maxLength={100}
                placeholder="Abdoun"
                value={form.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend>Price</legend>

          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="price">Price (JOD)</label>
              <input
                id="price" className="input" type="number" min="1" step="1" required
                placeholder="550"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="priceUnit">Rented by the</label>
              <select
                id="priceUnit" className="input"
                value={form.priceUnit}
                onChange={(e) => set("priceUnit", e.target.value)}
              >
                {PRICE_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="field-hint">
            Renters book in this unit only. A monthly listing cannot be booked by
            the week.
          </p>

          <div className="field">
            <label className="label" htmlFor="turnoverDays">Days needed between stays</label>
            <input
              id="turnoverDays" className="input" type="number" min="0" max="30"
              value={form.turnoverDays}
              onChange={(e) => set("turnoverDays", e.target.value)}
            />
            <p className="field-hint">
              Cleaning and handover. Bookings closer together than this are refused
              automatically.
            </p>
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend>Rooms and size</legend>

          <div className="form-row form-row-3">
            <div className="field">
              <label className="label" htmlFor="bedrooms">Bedrooms</label>
              <input
                id="bedrooms" className="input" type="number" min="0" max="50" required
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="bathrooms">Bathrooms</label>
              <input
                id="bathrooms" className="input" type="number" min="0" max="50" required
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="areaSqM">Area (m²)</label>
              <input
                id="areaSqM" className="input" type="number" min="1" max="100000" required
                placeholder="165"
                value={form.areaSqM}
                onChange={(e) => set("areaSqM", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row form-row-3">
            <div className="field">
              <label className="label" htmlFor="masterBedrooms">Master bedrooms <span className="optional">optional</span></label>
              <input
                id="masterBedrooms" className="input" type="number" min="0" max="20"
                value={form.masterBedrooms}
                onChange={(e) => set("masterBedrooms", e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="floorNumber">Floor <span className="optional">optional</span></label>
              <input
                id="floorNumber" className="input" type="number" min="0" max="50"
                value={form.floorNumber}
                onChange={(e) => set("floorNumber", e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="apartmentsInBuilding">Flats in building <span className="optional">optional</span></label>
              <input
                id="apartmentsInBuilding" className="input" type="number" min="1" max="500"
                value={form.apartmentsInBuilding}
                onChange={(e) => set("apartmentsInBuilding", e.target.value)}
              />
            </div>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={form.isFurnished}
              onChange={(e) => set("isFurnished", e.target.checked)}
            />
            <span>Furnished</span>
          </label>
        </fieldset>

        <fieldset className="form-block">
          <legend>Photos</legend>

          <label className="upload-drop">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFiles}
              disabled={busy}
            />
            <span className="upload-drop-title">Choose photos</span>
            <span className="upload-drop-hint">JPG, PNG or WEBP · up to 5 MB each</span>
          </label>

          {photos.length > 0 && (
            <>
              <div className="upload-grid">
                {photos.map((p, i) => (
                  <div
                    key={p.preview}
                    className={i === 0 ? "upload-item primary" : "upload-item"}
                  >
                    <img src={p.preview} alt="" />
                    {i === 0 && <span className="upload-badge">Main photo</span>}
                    <div className="upload-item-actions">
                      {i !== 0 && (
                        <button type="button" onClick={() => makePrimary(p.preview)}>
                          Make main
                        </button>
                      )}
                      <button type="button" onClick={() => removePhoto(p.preview)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="field-hint">
                The first photo is used on search results and booking cards.
                Photos upload when you publish.
              </p>
            </>
          )}
        </fieldset>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Publishing…" : "Publish listing"}
          </button>
          <Link to="/my-listings" className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
