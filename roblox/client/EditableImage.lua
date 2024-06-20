local VideoData = { 
	_interval = 20, 
	duration = 40,
	frameRate = 30,
	_dimensions = {
		width = 356,
		height = 200
	},
	_DEBUG = false
		
}

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")


local decoded = {}
local receivedChunks = {}

local function assembleChunks(idx)
	for frameIndex, parts in pairs(receivedChunks) do
		if #parts == 4 then
			local completeData = ""
			for _, chunk in ipairs(parts) do
				completeData = completeData .. chunk.data
			end
			decoded[frameIndex] = HttpService:JSONDecode(completeData)
			receivedChunks[frameIndex] = nil
			
			warn("Set #"..idx.." is ready to be played")
		end
	end
end

ReplicatedStorage.LargeDataEvent.OnClientEvent:Connect(function(chunk, frameIndex)
	if not receivedChunks[frameIndex] then
		receivedChunks[frameIndex] = {}
	end

	table.insert(receivedChunks[frameIndex], chunk)
	assembleChunks(frameIndex)
	if(VideoData._DEBUG) then
		print("Received chunk for frame #" .. frameIndex .. " part " .. chunk.part .. " of " .. chunk.totalParts)
	end
end)

local screenGui = Instance.new("ScreenGui")
screenGui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")

local imageLabel = Instance.new("ImageLabel")
imageLabel.Size = UDim2.new(0, VideoData._dimensions.width, 0, VideoData._dimensions.height)
imageLabel.Position = UDim2.new(0.5, -VideoData._dimensions.width / 2, 0.5, -VideoData._dimensions.height / 2)
imageLabel.Parent = screenGui

local image = Instance.new("EditableImage")
image.Size = Vector2.new(VideoData._dimensions.width, VideoData._dimensions.height)
image.Parent = imageLabel

local function numberToColour(number)
	local r = bit32.rshift(bit32.band(number, 0xff0000), 16)
	local g = bit32.rshift(bit32.band(number, 0x00ff00), 8)
	local b = bit32.band(number, 0x0000ff)
	return r / 255, g / 255, b / 255, 1 
end

local function GeneratePixels()
	if(VideoData._DEBUG) then
		print("Generating pixels")
	end
	local pixels = {}
	local pixcount = VideoData._dimensions.width * VideoData._dimensions.height * 4
	local zeroArray = table.create(pixcount, 0)

	RunService.RenderStepped:Connect(function()
		table.move(zeroArray, 1, pixcount, 1, pixels)

		local frameData = decoded[currentSet]
		if frameData then
			for y = 1, VideoData._dimensions.height do
				local row = frameData[y]
				if row then
					for x = 1, VideoData._dimensions.width do
						local pixelValue = row[x] and row[x][currentSecond] and row[x][currentSecond][currentFrameInSecond]
						local index = ((y - 1) * VideoData._dimensions.width + (x - 1)) * 4 + 1

						if(pixelValue) then
							local r, g, b, a = numberToColour(pixelValue)
							pixels[index] = r
							pixels[index + 1] = g
							pixels[index + 2] = b
							pixels[index + 3] = a
						end
					end
				end
			end
		end

		if #pixels == pixcount then
			image:WritePixels(Vector2.new(0, 0), Vector2.new(VideoData._dimensions.width, VideoData._dimensions.height), pixels)
		end
	end)
end

GeneratePixels()

local timeAddOn = 0
local function checkVoid()
	if decoded[currentSet] and decoded[currentSet][1][1][currentSecond] == nil then
		currentSecond = currentSecond + 1
		timeAddOn += 1
		checkVoid()
	end
end

script.Parent.TextButton.MouseButton1Down:Connect(function()
	local startTick = tick()

	local videoRenderConn
	videoRenderConn = RunService.RenderStepped:Connect(function()
		local totalElapsedTime = tick() - (startTick-timeAddOn)
		local totalFramesElapsed = math.floor(VideoData.frameRate * totalElapsedTime)
		
		currentSecond = math.floor(totalFramesElapsed / VideoData.frameRate) + 1
		currentFrameInSecond = (totalFramesElapsed % VideoData.frameRate) + 1
		currentSet = math.ceil(currentSecond / 20)
		
		currentSecond = (currentSecond - 1) % 20 + 1
		checkVoid()
		
		if totalElapsedTime >= VideoData.duration then
			warn("Video took " .. totalElapsedTime .. " seconds to run.")
			videoRenderConn:Disconnect()
			return
		end
	end)
end)