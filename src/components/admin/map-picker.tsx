'use client'

import { useCallback, useEffect, useRef } from 'react'
import Script from 'next/script'

interface Props {
  address?: string | null
  initialLat?: number | null
  initialLng?: number | null
}

export function MapPicker({ address, initialLat, initialLng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const latInputRef = useRef<HTMLInputElement>(null)
  const lngInputRef = useRef<HTMLInputElement>(null)

  const updateCoords = useCallback((latVal: number, lngVal: number) => {
    if (latInputRef.current) latInputRef.current.value = latVal.toFixed(7)
    if (lngInputRef.current) lngInputRef.current.value = lngVal.toFixed(7)
  }, [])

  const initMap = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakao = (window as any).kakao
    if (!kakao?.maps || !containerRef.current) return

    kakao.maps.load(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const placeMap = (coords: any) => {
        if (!containerRef.current) return
        const map = new kakao.maps.Map(containerRef.current, { center: coords, level: 4 })
        const marker = new kakao.maps.Marker({ map, position: coords, draggable: true })

        updateCoords(coords.getLat(), coords.getLng())

        kakao.maps.event.addListener(marker, 'dragend', () => {
          const pos = marker.getPosition()
          updateCoords(pos.getLat(), pos.getLng())
        })

        kakao.maps.event.addListener(map, 'click', (e: { latLng: unknown }) => {
          marker.setPosition(e.latLng)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pos = e.latLng as any
          updateCoords(pos.getLat(), pos.getLng())
        })
      }

      if (initialLat && initialLng) {
        placeMap(new kakao.maps.LatLng(initialLat, initialLng))
        return
      }

      if (address) {
        const geocoder = new kakao.maps.services.Geocoder()
        geocoder.addressSearch(address, (result: { x: string; y: string }[], status: string) => {
          if (status === kakao.maps.services.Status.OK) {
            placeMap(new kakao.maps.LatLng(result[0].y, result[0].x))
          }
        })
      }
    })
  }, [address, initialLat, initialLng, updateCoords])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).kakao?.maps) initMap()
  }, [initMap])

  return (
    <div className="space-y-2">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
        onLoad={initMap}
      />
      <div ref={containerRef} className="w-full rounded border" style={{ height: 320 }} />
      <p className="text-xs text-gray-400">지도를 클릭하거나 마커를 드래그해서 정확한 위치를 지정하세요.</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-gray-500">위도 (Latitude)</label>
          <input
            ref={latInputRef}
            className="w-full rounded border px-2 py-1.5 text-sm text-gray-600"
            defaultValue={initialLat ?? ''}
            name="mapLatitude"
            placeholder="지도를 클릭하세요"
            step="any"
            type="text"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">경도 (Longitude)</label>
          <input
            ref={lngInputRef}
            className="w-full rounded border px-2 py-1.5 text-sm text-gray-600"
            defaultValue={initialLng ?? ''}
            name="mapLongitude"
            placeholder="지도를 클릭하세요"
            step="any"
            type="text"
          />
        </div>
      </div>
    </div>
  )
}
