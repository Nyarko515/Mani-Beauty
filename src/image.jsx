export default function Image({ priority, ...props }) {
  return <img {...props} loading={priority ? 'eager' : props.loading} />
}
