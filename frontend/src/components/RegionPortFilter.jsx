import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { Globe, Anchor } from "lucide-react"
import { geographyApi } from "../api/client"

/**
 * Region and port filter widget for the investor dashboard.
 * Exposes a national view by default; lets the user drill down by region and port.
 */
export default function RegionPortFilter({ onChange }) {
  const [regions, setRegions] = useState([])
  const [ports, setPorts] = useState([])
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedPort, setSelectedPort] = useState("")

  useEffect(() => {
    geographyApi.regions().then((res) => setRegions(res.data?.data ?? []))
  }, [])

  useEffect(() => {
    geographyApi
      .ports(selectedRegion || undefined)
      .then((res) => setPorts(res.data?.data ?? []))
    // Reset port when region changes
    setSelectedPort("")
    onChange({ region_id: selectedRegion || null, port_id: null })
  }, [selectedRegion]) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePortChange(portId) {
    setSelectedPort(portId)
    onChange({ region_id: selectedRegion || null, port_id: portId || null })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Region selector */}
      <div className="flex items-center gap-1.5">
        <Globe size={14} className="text-muted" />
        <select
          className="input py-1.5 text-sm min-w-[200px]"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          <option value="">Vue Nationale</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Port selector — only shown when a region is selected */}
      {selectedRegion && (
        <div className="flex items-center gap-1.5">
          <Anchor size={14} className="text-muted" />
          <select
            className="input py-1.5 text-sm min-w-[180px]"
            value={selectedPort}
            onChange={(e) => handlePortChange(e.target.value)}
          >
            <option value="">Tous les ports</option>
            {ports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

RegionPortFilter.propTypes = {
  /** Called whenever the filter changes with { region_id, port_id } */
  onChange: PropTypes.func.isRequired,
}
