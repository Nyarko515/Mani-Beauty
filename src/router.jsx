import {
  Link as RouterLink,
  useNavigate,
  useSearchParams as useRouterSearchParams,
} from 'react-router-dom'
import { useMemo } from 'react'

export function Link({ href, children, ...props }) {
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  )
}

export function useRouter() {
  const navigate = useNavigate()

  return useMemo(
    () => ({
      push: navigate,
      replace: (to) => navigate(to, { replace: true }),
      back: () => navigate(-1),
    }),
    [navigate]
  )
}

export function useSearchParams() {
  const [searchParams] = useRouterSearchParams()
  return searchParams
}
