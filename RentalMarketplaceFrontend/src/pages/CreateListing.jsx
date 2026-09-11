import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createHouse, updateHouse, getHouse, uploadHouseImage } from "../api/houses";
import { getErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Trans, useTranslation } from "react-i18next";
import { useFieldErrors } from "../utils/validation";
import FieldError from "../components/FieldError";
import Autocomplete from "../components/Autocomplete";
import { neighbourhoodOptions, belongsToCity } from "../utils/neighbourhoods";
import { JORDAN_CITIES } from "../utils/cities";
import { getMySubscription } from "../api/subscription";

// These integers are the Domain enums. If any of them is renumbered,
// these lists have to change with it.
const PROPERTY_TYPES = [
  { value: 1, key: "propertyType.apartment" },
  { value: 2, key: "propertyType.house" },
  { value: 3, key: "propertyType.villa" },
  { value: 4, key: "propertyType.studio" },
  { value: 5, key: "propertyType.room" },
];

const PRICE_UNITS = [
  { value: 1, key: "period.weekly" },
  { value: 2, key: "period.monthly" },
  { value: 3, key: "period.yearly" },
];

const BUILDING_AGES = [
  { value: "", key: "listing.notSpecified" },
  { value: 1, key: "listing.ageUnder1" },
  { value: 2, key: "listing.age1to5" },
  { value: 3, key: "listing.age5to10" },
  { value: 4, key: "listing.age10to20" },
  { value: 5, key: "listing.ageOver20" },
];

/* HouseDto returns enum names ("Villa", "Yearly", "OneToFiveYears") while the
   form and the update DTO both use the integers. These turn a loaded listing
   back into form values; a name the maps do not know falls back to the default
   rather than sending NaN to the API. */
const TYPE_VALUE = { Apartment: 1, House: 2, Villa: 3, Studio: 4, Room: 5 };
const UNIT_VALUE = { Weekly: 1, Monthly: 2, Yearly: 3 };
const AGE_VALUE = {
  UnderOneYear: 1, OneToFiveYears: 2, FiveToTenYears: 3,
  TenToTwentyYears: 4, OverTwentyYears: 5,
};

// Was a private list of eight, while the search offered twelve and the About
// page advertised twelve — so an owner could not list a property in Ajloun,
// Mafraq, Tafilah or Ma'an. cities.js exists precisely so the two cannot
// drift; this file had never been pointed at it.
const CITIES = JORDAN_CITIES;

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

/**
 * Serves both /houses/new and /houses/:id/edit.
 *
 * One component rather than two, because the two forms are the same twenty
 * fields with the same validation — a second copy would drift the moment one
 * of them gained a field. The route decides which mode it is in.
 */
export default function CreateListing() {
  const { t } = useTranslation();
  const toast = useToast();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState(EMPTY);
  // { file, preview } — nothing is uploaded until the listing exists, so an
  // abandoned form leaves nothing on the server.
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sub, setSub] = useState(null);
  const { user } = useAuth();
  const { errors, validate, clearError } = useFieldErrors();
  const navigate = useNavigate();

  // Populates the form in edit mode. Only the editable fields are copied —
  // status, owner and images are not the owner's to resubmit, and the update
  // DTO has no room for them.
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    getHouse(id)
      .then((h) => {
        if (cancelled) return;
        setForm({
          title: h.title ?? "",
          description: h.description ?? "",
          propertyType: TYPE_VALUE[h.propertyType] ?? 1,
          address: h.address ?? "",
          city: h.city ?? "Amman",
          neighborhood: h.neighborhood ?? "",
          price: h.price ?? "",
          priceUnit: UNIT_VALUE[h.priceUnit] ?? 2,
          bedrooms: h.bedrooms ?? 1,
          bathrooms: h.bathrooms ?? 1,
          areaSqM: h.areaSqM ?? "",
          isFurnished: Boolean(h.isFurnished),
          floorNumber: h.floorNumber ?? "",
          masterBedrooms: h.masterBedrooms ?? "",
          apartmentsInBuilding: h.apartmentsInBuilding ?? "",
          buildingAge: AGE_VALUE[h.buildingAge] ?? "",
          turnoverDays: h.turnoverDays ?? 2,
        });
      })
      .catch((err) => setError(getErrorMessage(err, t("house.couldNotLoad"))))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, isEdit, t]);

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
    // A neighbourhood belongs to one city, so moving the city has to drop
    // it. Left behind, the listing would be saved as Abdoun-in-Aqaba and
    // then never appear under either.
    if (field === "city") {
      setForm((f) => ({
        ...f,
        city: value,
        neighborhood: belongsToCity(value, f.neighborhood) ? f.neighborhood : "",
      }));
      clearError("city");
      clearError("neighborhood");
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
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

    if (!validate(e.currentTarget)) return;

    setBusy(true);

    try {
      const payload = {
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
      };

      // createHouse wants imageUrls; the update DTO has no such field, because
      // photos are managed through their own endpoint and resubmitting the
      // listing must not be able to drop one.
      const saved = isEdit
        ? await updateHouse(id, payload)
        : await createHouse({ ...payload, imageUrls: [] });

      // Photos go up after the listing exists, so each one has a house folder
      // to live in. Sequential, so the order chosen is the order stored and the
      // first upload becomes the main photo.
      for (const { file } of photos) {
        try {
          await uploadHouseImage(saved.id, file);
        } catch {
          // The listing is already saved; a failed photo should not lose it.
          setError(`The listing was published, but ${file.name} could not be uploaded.`);
        }
      }

      toast.success(isEdit ? t("listing.updated") : t("listing.created"));
      navigate(`/houses/${saved.id}`, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, isEdit ? t("listing.couldNotUpdate") : t("listing.couldNotCreate"));
      setError(message);
      toast.error(message);
      setBusy(false);
    }
  }

  // The five fields the markup marks required and that can still be blank —
  // bedrooms, bathrooms, city and the rest all carry defaults, so counting
  // them would tell the owner they have work left when they do not.
  const missing = ["title", "description", "address", "price", "areaSqM"]
    .filter((k) => String(form[k] ?? "").trim() === "").length;

  return (
    <div className="container section">
      <h1 className="page-title">{isEdit ? t("listing.editTitle") : t("listing.title")}</h1>
      <p className="muted page-sub">
        <Trans i18nKey={isEdit ? "listing.editSub" : "listing.sub"}>
          <Link to="/my-listings" />
        </Trans>
      </p>

      {/* The API refuses without a subscription, so say so before the form is
          filled in rather than after it is submitted. An admin is exempt on
          the server, so showing them the warning would be a lie. */}
      {!isEdit && sub && !sub.isActive && user?.role !== "Admin" && (
        <div className="sub-status">
          <span className="badge badge-rejected">{t("listing.notActive")}</span>
          <p className="muted">
            {t("listing.needsSubscription", { price: sub.pricePerMonth })}{" "}
            <Link to="/subscribe">{t("listing.subscribe")}</Link>.
          </p>
        </div>
      )}

      <form className="listing-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="error-text">{error}</p>}

        <fieldset className="form-block">
          <legend>
            <span className="form-step" aria-hidden="true">1</span>
            {t("listing.legendProperty")}
          </legend>
          <p className="form-block-hint">{t("listing.stepProperty")}</p>

          <div className="field">
            <label className="label" htmlFor="title">{t("listing.listingTitle")}</label>
            <input
              id="title" className="input" maxLength={150} required
              placeholder={t("listing.titlePlaceholder")}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            <FieldError>{errors.title}</FieldError>
          </div>

          <div className="field">
            <label className="label" htmlFor="description">{t("listing.description")}</label>
            <textarea
              id="description" className="input" rows={4} maxLength={2000} required
              placeholder={t("listing.descriptionPlaceholder")}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <FieldError>{errors.description}</FieldError>
          </div>

          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="propertyType">{t("listing.propertyTypeLabel")}</label>
              <select
                id="propertyType" className="input"
                value={form.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{t(pt.key)}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="buildingAge">{t("listing.buildingAgeLabel")}</label>
              <select
                id="buildingAge" className="input"
                value={form.buildingAge}
                onChange={(e) => set("buildingAge", e.target.value)}
              >
                {BUILDING_AGES.map((a) => (
                  <option key={a.key} value={a.value}>{t(a.key)}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend>
            <span className="form-step" aria-hidden="true">2</span>
            {t("listing.legendWhere")}
          </legend>
          <p className="form-block-hint">{t("listing.stepWhere")}</p>

          <div className="field">
            <label className="label" htmlFor="address">{t("listing.address")}</label>
            <input
              id="address" className="input" maxLength={250} required
              placeholder={t("listing.addressPlaceholder")}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
            <FieldError>{errors.address}</FieldError>
          </div>

          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="city">{t("houses.city")}</label>
              <select
                id="city" className="input"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              >
                {CITIES.map((c) => <option key={c} value={c}>{t(`city.${c}`, { defaultValue: c })}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="neighborhood">{t("listing.neighbourhood")} <span className="optional">{t("listing.optional")}</span></label>
              {/* The same control the filter bar uses — type to narrow,
                  pick to commit. It was a free text box, which is why a
                  neighbourhood could never be translated: there was no
                  stable value to look a translation up by. */}
              <Autocomplete
                id="neighborhood"
                label={t("listing.neighbourhood")}
                placeholder={t("listing.neighbourhoodPlaceholder")}
                options={neighbourhoodOptions(t, form.city)}
                value={form.neighborhood}
                onChange={(v) => set("neighborhood", v)}
              />
              <FieldError>{errors.neighborhood}</FieldError>
            </div>
          </div>
        </fieldset>


        <fieldset className="form-block">
          <legend>
            <span className="form-step" aria-hidden="true">3</span>
            {t("listing.legendRooms")}
          </legend>
          <p className="form-block-hint">{t("listing.stepRooms")}</p>

          <div className="form-row form-row-3">
            <div className="field">
              <label className="label" htmlFor="bedrooms">{t("listing.bedrooms")}</label>
              <input
                id="bedrooms" className="input" type="number" min="0" max="50" required
                value={form.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
              />
              <FieldError>{errors.bedrooms}</FieldError>
            </div>
            <div className="field">
              <label className="label" htmlFor="bathrooms">{t("listing.bathrooms")}</label>
              <input
                id="bathrooms" className="input" type="number" min="0" max="50" required
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
              />
              <FieldError>{errors.bathrooms}</FieldError>
            </div>
            <div className="field">
              <label className="label" htmlFor="areaSqM">{t("listing.area")}</label>
              <input
                id="areaSqM" className="input" type="number" min="1" max="100000" required
                placeholder={t("listing.areaPlaceholder")}
                value={form.areaSqM}
                onChange={(e) => set("areaSqM", e.target.value)}
              />
              <FieldError>{errors.areaSqM}</FieldError>
            </div>
          </div>

          {/* Three fields nobody has to fill in, folded away. Open, they made the
              section look twice as long as the work it actually asks for,
              which is most of what makes a form feel heavy. */}
          <details className="more-fields">
            <summary>{t("listing.moreDetails")}</summary>
            <div className="form-row form-row-3">
            <div className="field">
              <label className="label" htmlFor="masterBedrooms">{t("listing.masterBedrooms")} <span className="optional">{t("listing.optional")}</span></label>
              <input
                id="masterBedrooms" className="input" type="number" min="0" max="20"
                value={form.masterBedrooms}
                onChange={(e) => set("masterBedrooms", e.target.value)}
              />
              <FieldError>{errors.masterBedrooms}</FieldError>
            </div>
            <div className="field">
              <label className="label" htmlFor="floorNumber">{t("listing.floor")} <span className="optional">{t("listing.optional")}</span></label>
              <input
                id="floorNumber" className="input" type="number" min="0" max="50"
                value={form.floorNumber}
                onChange={(e) => set("floorNumber", e.target.value)}
              />
              <FieldError>{errors.floorNumber}</FieldError>
            </div>
            <div className="field">
              <label className="label" htmlFor="apartmentsInBuilding">{t("listing.flatsInBuilding")} <span className="optional">{t("listing.optional")}</span></label>
              <input
                id="apartmentsInBuilding" className="input" type="number" min="1" max="500"
                value={form.apartmentsInBuilding}
                onChange={(e) => set("apartmentsInBuilding", e.target.value)}
              />
              <FieldError>{errors.apartmentsInBuilding}</FieldError>
            </div>
          </div>
          </details>

          <label className="check">
            <input
              type="checkbox"
              checked={form.isFurnished}
              onChange={(e) => set("isFurnished", e.target.checked)}
            />
            <span>{t("listing.furnished")}</span>
          </label>
        </fieldset>

        <fieldset className="form-block">
          <legend>
            <span className="form-step" aria-hidden="true">4</span>
            {t("listing.legendPrice")}
          </legend>
          <p className="form-block-hint">{t("listing.stepPrice")}</p>

          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="price">{t("listing.priceLabel")}</label>
              <input
                id="price" className="input" type="number" min="1" step="1" required
                placeholder={t("listing.pricePlaceholder")}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
              <FieldError>{errors.price}</FieldError>
            </div>

            <div className="field">
              <label className="label" htmlFor="priceUnit">{t("listing.rentedByThe")}</label>
              <select
                id="priceUnit" className="input"
                value={form.priceUnit}
                onChange={(e) => set("priceUnit", e.target.value)}
              >
                {PRICE_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{t(u.key)}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="field-hint">
            Renters book in this unit only. A monthly listing cannot be booked by
            the week.
          </p>

          <div className="field">
            <label className="label" htmlFor="turnoverDays">{t("listing.daysBetweenStays")}</label>
            <input
              id="turnoverDays" className="input" type="number" min="0" max="30"
              value={form.turnoverDays}
              onChange={(e) => set("turnoverDays", e.target.value)}
            />
            <FieldError>{errors.turnoverDays}</FieldError>
            <p className="field-hint">
              Cleaning and handover. Bookings closer together than this are refused
              automatically.
            </p>
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend>
            <span className="form-step" aria-hidden="true">5</span>
            {t("listing.legendPhotos")}
          </legend>
          <p className="form-block-hint">{t("listing.stepPhotos")}</p>

          <label className="upload-drop">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFiles}
              disabled={busy}
            />
            <span className="upload-drop-title">{t("listing.choosePhotos")}</span>
            <span className="upload-drop-hint">{t("listing.photoHint")}</span>
          </label>

          {photos.length > 0 && (
            <>
              <div className="upload-grid">
                {photos.map((p, i) => (
                  <div
                    key={p.preview}
                    className={i === 0 ? "upload-item primary" : "upload-item"}
                  >
                    {/* The photo and the buttons are separate rows now. The
                        actions used to be laid over the bottom of the image,
                        which was survivable in English and not in Arabic:
                        "جعلها الرئيسية" wraps to two lines at this width, so
                        the overlay grew until it covered half the picture the
                        owner was trying to judge. */}
                    <div className="upload-thumb">
                      <img src={p.preview} alt="" />
                      {i === 0 && <span className="upload-badge">{t("listing.mainPhoto")}</span>}
                    </div>
                    <div className="upload-item-actions">
                      {i !== 0 && (
                        <button type="button" onClick={() => makePrimary(p.preview)}>
                          {t("listing.makeMain")}
                        </button>
                      )}
                      <button type="button" onClick={() => removePhoto(p.preview)}>
                        {t("listing.remove")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="field-hint">
                {t("listing.primaryHint")} {t("listing.photosUploadOnPublish")}
              </p>
            </>
          )}
        </fieldset>

        {/* Pinned, so the way out of a five-section form is never a scroll
            away, and carrying a count of what is still blank — a disabled
            button that will not say why is the most common way a long form
            wastes someone's time. */}
        <div className="form-actions sticky">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? (isEdit ? t("listing.saving") : t("listing.publishing")) : (isEdit ? t("listing.saveChanges") : t("listing.publish"))}
          </button>
          <Link to="/my-listings" className="btn btn-outline">{t("common.cancel")}</Link>
          {missing > 0 && (
            <span className="form-remaining">{t("listing.stillNeeded", { count: missing })}</span>
          )}
        </div>
      </form>
    </div>
  );
}
