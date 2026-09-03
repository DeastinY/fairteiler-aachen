import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  fetchFairteilerDetail,
  fetchFairteilerList,
  submitReport,
} from '../src/composables/api'
import { getDeviceId } from '../src/composables/device'
import { jsonResponse, makeDetail, makeFairteiler } from './fixtures'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('api composable', () => {
  it('fetches the list from /api/fairteiler', async () => {
    const list = [makeFairteiler()]
    fetchMock.mockResolvedValue(jsonResponse(list))

    const result = await fetchFairteilerList()

    expect(fetchMock).toHaveBeenCalledWith('/api/fairteiler', undefined)
    expect(result).toEqual(list)
  })

  it('fetches a detail from /api/fairteiler/{id}', async () => {
    const detail = makeDetail()
    fetchMock.mockResolvedValue(jsonResponse(detail))

    const result = await fetchFairteilerDetail(810)

    expect(fetchMock).toHaveBeenCalledWith('/api/fairteiler/810', undefined)
    expect(result).toEqual(detail)
  })

  it('posts a report with JSON body and X-Device-Id header', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ type: 'brought', tags: ['obst'], createdAt: '2026-09-03T10:00:00+00:00' }, 201),
    )

    await submitReport(810, { type: 'brought', tags: ['obst'] })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/fairteiler/810/reports')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.headers['X-Device-Id']).toBe(getDeviceId())
    expect(init.headers['X-Device-Id'].length).toBeGreaterThanOrEqual(4)
    expect(JSON.parse(init.body)).toEqual({ type: 'brought', tags: ['obst'] })
  })

  it('reuses the same device id across calls', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({}, 201)))
    await submitReport(810, { type: 'taken', tags: [] })
    await submitReport(810, { type: 'taken', tags: [] })
    const first = fetchMock.mock.calls[0]![1].headers['X-Device-Id']
    const second = fetchMock.mock.calls[1]![1].headers['X-Device-Id']
    expect(first).toBe(second)
  })

  it('surfaces the German 429 detail message as ApiError', async () => {
    const detail =
      'Für diesen Fairteiler hast du gerade schon gemeldet – bitte warte ein paar Minuten (10 Min Abstand).'
    fetchMock.mockResolvedValue(jsonResponse({ detail }, 429))

    const error = await submitReport(810, { type: 'empty', tags: [] }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(429)
    expect(error.message).toBe(detail)
  })

  it('falls back to a generic German message for non-JSON errors', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }))

    const error = await fetchFairteilerList().catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(500)
    expect(error.message).toMatch(/schiefgelaufen/)
  })
})
