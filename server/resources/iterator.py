def lambda_handler(event, context):
    print(event)            
    index = event["iterator"]["index"]
    step = event["iterator"]["step"]
    total_waves = int(event["iterator"]["total_waves"])
    
    index = index + step
    
    iterator = {}
    iterator["index"] = index
    iterator["step"] = index
    iterator["total_waves"] = total_waves
    iterator["indexString"] = str(index)

    if index > total_waves:
        iterator["continue"] = False
    else:
        iterator["continue"] = True
        
    
    return({
        "iterator": iterator,
    })