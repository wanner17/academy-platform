'use client'

import { useRef, useCallback } from 'react'
import Script from 'next/script'

interface Props {
  address: string
  name: string
  lat?: number | null
  lng?: number | null
  mapUrl?: string | null
}

export function KakaoMap({ address, name, lat, lng, mapUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const initMap = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakao = (window as any).kakao
    if (!kakao?.maps) return

    kakao.maps.load(() => {
      if (!containerRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const placeMarker = (coords: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = new kakao.maps.Map(containerRef.current as any, { center: coords, level: 3 })
        const marker = new kakao.maps.Marker({ map, position: coords })
        const infowindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:13px;font-weight:600;white-space:nowrap">${name}</div>`,
        })
        infowindow.open(map, marker)
      }

      const geocodeAndPlace = () => {
        const geocoder = new kakao.maps.services.Geocoder()
        geocoder.addressSearch(address, (result: { x: string; y: string }[], status: string) => {
          if (status !== kakao.maps.services.Status.OK || !containerRef.current) return
          placeMarker(new kakao.maps.LatLng(result[0].y, result[0].x))
        })
      }

      // 1. 명시적 좌표 우선
      if (lat && lng) {
        placeMarker(new kakao.maps.LatLng(lat, lng))
        return
      }

      // 2. mapUrl에 urlX/urlY 있으면 WCONGNAMUL → WGS84 변환
      if (mapUrl) {
        try {
          const params = new URL(mapUrl).searchParams
          const urlX = params.get('urlX')
          const urlY = params.get('urlY')
          if (urlX && urlY) {
            const transcoord = new kakao.maps.services.Transcoord()
            transcoord.transCoord(
              Number(urlX), Number(urlY),
              (result: { x: number; y: number }[], status: string) => {
                if (status === kakao.maps.services.Status.OK) {
                  placeMarker(new kakao.maps.LatLng(result[0].y, result[0].x))
                } else {
                  geocodeAndPlace()
                }
              },
              { inputCoord: kakao.maps.services.Coord.WCONGNAMUL, outputCoord: kakao.maps.services.Coord.WGS84 }
            )
            return
          }
        } catch {
          // malformed URL → fall through
        }
      }

      // 3. 주소로 geocoding
      geocodeAndPlace()
    })
  }, [address, name, lat, lng, mapUrl])

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
        onLoad={initMap}
      />
      <div ref={containerRef} className="pub-kakao-map" />
    </>
  )
}
