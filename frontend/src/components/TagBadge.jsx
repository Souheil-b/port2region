import PropTypes from "prop-types"

const SECTOR_STYLES = {
  transport: "bg-blue-50 text-blue-700 border-blue-200",
  agroalim: "bg-green-50 text-green-700 border-green-200",
  it: "bg-violet-50 text-violet-700 border-violet-200",
  hospitality: "bg-amber-50 text-amber-700 border-amber-200",
  btp: "bg-gray-50 text-gray-700 border-gray-200",
  maintenance: "bg-cyan-50 text-cyan-700 border-cyan-200",
}

export default function TagBadge({ tag, sector = "transport" }) {
  const style = SECTOR_STYLES[sector] || SECTOR_STYLES.transport
  return (
    <span className={`badge border text-[11px] ${style}`}>
      {tag.replace(/_/g, " ")}
    </span>
  )
}

TagBadge.propTypes = { tag: PropTypes.string.isRequired, sector: PropTypes.string }
