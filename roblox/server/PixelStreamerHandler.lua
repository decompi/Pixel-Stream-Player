local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local LargeDataEvent = ReplicatedStorage.LargeDataEvent
local DebugPrintModule = require(script:WaitForChild("DebugPrintModule"))

DebugPrintModule.DEBUG = false

local SERVER_URL = "http://localhost:8080/"
local LENGTH = 60
local INTERVAL = 20
local NUM_CHUNKS = 4
local FETCH_DELAY = 0.1
local SEND_DELAY = 0.1


local currentCursor = 1
local decoded = {}

local function getJsonFromCursor(cursor)
	DebugPrintModule.print("Current Cursor:", cursor)
	local data = HttpService:GetAsync(SERVER_URL, false, {
		["nextMapCursor"] = tostring(cursor),
	})
	local returnedData = HttpService:JSONDecode(data)
	currentCursor = returnedData.nextCursor
	return returnedData.frame
end

local function initializeBitmapData()
	DebugPrintModule.print("Getting Bitmap Data")
	for i = 1, LENGTH / INTERVAL do
		task.wait(FETCH_DELAY)
		local index = currentCursor
		DebugPrintModule.print("Fetching data chunk:", i, "Cursor:", currentCursor)
		local data = getJsonFromCursor(index)
		decoded[index] = data
		DebugPrintModule.print("Progress:", i, "/", LENGTH / INTERVAL)
	end
	DebugPrintModule.print("Bitmap Data Completed")
end

local function chunkData(data, numChunks)
	local chunkSize = math.ceil(#data / numChunks)
	local chunks = {}
	for i = 1, numChunks do
		local startIdx = (i - 1) * chunkSize + 1
		local endIdx = math.min(i * chunkSize, #data)
		local chunkData = string.sub(data, startIdx, endIdx)
		table.insert(chunks, {
			data = chunkData,
			part = i,
			totalParts = numChunks,
			size = #chunkData
		})
	end
	return chunks
end

local function sendChunkedData()
	local batchSize = 5
	for i = 1, LENGTH / INTERVAL do
		DebugPrintModule.print("SENDING FRAME #", i)
		local jsonData = HttpService:JSONEncode(decoded[i])
		local chunks = chunkData(jsonData, NUM_CHUNKS)

		for batchStart = 1, #chunks, batchSize do
			local batchEnd = math.min(batchStart + batchSize - 1, #chunks)
			for j = batchStart, batchEnd do
				local chunk = chunks[j]
				task.defer(function()
					LargeDataEvent:FireAllClients(chunk, i)
				end)
			end
			task.wait(SEND_DELAY)
		end
		DebugPrintModule.print("SENT")
	end
	game.ReplicatedStorage.loading:FireAllClients()
end


initializeBitmapData()
sendChunkedData()