local DebugPrintModule = {}
DebugPrintModule.DEBUG = true 

function DebugPrintModule.print(...)
	if DebugPrintModule.DEBUG then
		print(...)
	end
end

return DebugPrintModule