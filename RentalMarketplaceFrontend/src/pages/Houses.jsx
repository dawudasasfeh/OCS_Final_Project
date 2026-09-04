import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchHouses } from "../api/houses";
import { getErrorMessage } from "../api/errors";

const TYPES = [
  { value: "", label: "Any type" },
  { value: "1", label: "Apartment" },
  { value: "2", label: "House" },
  { value: "3", label: "Villa" },
  { value: "4", label: "Studio" },
  { value: "5", label: "Room" },
];

const PERIODS = [
  { value: "", label: "Any period" },
  { value: "1", label: "Weekly" },
  { value: "2", label: "Monthly" },
  { value: "3", label: "Yearly" },
];

export default function Houses () {
    const [searchParams, setSearchParams] = useSearchParams();

    const [form, setForm] = useState({
    city: searchParams.get("city") ?? "",
    propertyType: searchParams.get("propertyType") ?? "",
    priceUnit: searchParams.get("priceUnit") ?? "",
    bedrooms: searchParams.get("bedrooms") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    isFurnished: searchParams.get("isFurnished") ?? "",
  });

  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(()=>{
    let cancelled = false;

    async function load(){
        setLoading(true);
        setError("");
        try{
            const data = await searchHouses(Object.fromEntries(searchParams));
            if(!cancelled) setHouses(data);
        } catch(err){
            if(!cancelled) setError(getErrorMessage(err, "Could not load listings."));
        } finally{
            if(!cancelled) setLoading(false);
        }
    }

    load();
    return () => {cancelled = true;};
  }, [searchParams]);

  function update(e) {
    const {name, value} = e.target;
    setForm((prev) => ({...prev, [name]: value}));
  }

  function applyFilters(e){
     e.preventDefault();
     const clean = Object.fromEntries(
        Object.entries(form).filter(([,v] )=> v !== "")
     );
     setSearchParams(clean);
  }

  
  function clearFilters() {
    setForm({
      city: "", propertyType: "", priceUnit: "",
      bedrooms: "", minPrice: "", maxPrice: "", isFurnished: "",
    });
    setSearchParams({});
  }
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Properties</h1>
          <p>Browse homes available to rent across Jordan.</p>
        </div>
      </section>

      <section className="section">
        <div className="container listing-layout">

          <aside className="filter-panel">
            <form onSubmit={applyFilters}>
              <h2>Filters</h2>

              <div className="field">
                <label className="label" htmlFor="city">City</label>
                <input id="city" name="city" className="input"
                       placeholder="Amman, Irbid…"
                       value={form.city} onChange={update} />
              </div>

              <div className="field">
                <label className="label" htmlFor="propertyType">Property type</label>
                <select id="propertyType" name="propertyType" className="input"
                        value={form.propertyType} onChange={update}>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="priceUnit">Rental period</label>
                <select id="priceUnit" name="priceUnit" className="input"
                        value={form.priceUnit} onChange={update}>
                  {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="bedrooms">Bedrooms (minimum)</label>
                <input id="bedrooms" name="bedrooms" className="input" type="number" min="0"
                       placeholder="Any" value={form.bedrooms} onChange={update} />
              </div>

              <div className="filter-row">
                <div className="field">
                  <label className="label" htmlFor="minPrice">Min price</label>
                  <input id="minPrice" name="minPrice" className="input" type="number" min="0"
                         placeholder="0" value={form.minPrice} onChange={update} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="maxPrice">Max price</label>
                  <input id="maxPrice" name="maxPrice" className="input" type="number" min="0"
                         placeholder="Any" value={form.maxPrice} onChange={update} />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="isFurnished">Furnishing</label>
                <select id="isFurnished" name="isFurnished" className="input"
                        value={form.isFurnished} onChange={update}>
                  <option value="">Any</option>
                  <option value="true">Furnished</option>
                  <option value="false">Unfurnished</option>
                </select>
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
                Apply filters
              </button>
              <button className="btn btn-ghost" type="button" onClick={clearFilters}
                      style={{ width: "100%", marginTop: ".4rem" }}>
                Clear all
              </button>
            </form>
          </aside>

          <div>
            {loading && <p className="muted">Loading listings…</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && !error && (
              <>
                <p className="results-count">
                  {houses.length} {houses.length === 1 ? "property" : "properties"} found
                </p>

                {houses.length === 0 ? (
                  <div className="empty-state">
                    <p>No properties match these filters.</p>
                    <button className="btn btn-outline" type="button" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="grid-houses">
                    {houses.map((h) => (
                      <Link to={`/houses/${h.id}`} key={h.id} className="house-card">
                        <div className="house-thumb">
                          {h.isFurnished && <span className="house-tag">Furnished</span>}
                          Photo
                        </div>
                        <div className="house-body">
                          <p className="house-city">
                            {h.city}{h.neighborhood ? ` · ${h.neighborhood}` : ""}
                          </p>
                          <h3 className="house-title">{h.title}</h3>
                          <div className="house-meta">
                            <span>{h.bedrooms} beds</span>
                            <span>{h.bathrooms} baths</span>
                            <span>{h.areaSqM} m²</span>
                          </div>
                          <div className="house-foot">
                            <span className="house-price">
                              {h.price} JOD <span>/ {h.priceUnit.toLowerCase()}</span>
                            </span>
                            <span className="house-link">View details</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </section>
    </>
  );
} 