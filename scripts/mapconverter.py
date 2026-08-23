#!/bin/python3
import xml.etree.ElementTree as ET
import sys


base32table : list[str] = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 
    'U', 'V']


def toBase32(input : int) -> str:
    return base32table[max(0, min(int(input), 31))]


def parse_layer(input : str, offset : str) -> str:
    out : str = ""
    for i in input.replace("\n", "").replace("\r","").split(","):
        out += toBase32(int(i) - offset)
    return out


def parse_file(inp : str) -> str:

    root : ET.Element = ET.parse(inp).getroot()

    out : str = "\"" + toBase32(root.attrib["width"]) + toBase32(root.attrib["height"])

    layerCount : int = 0
    for layer in root.iter("layer"):
        for data in layer.iter("data"):
            out += parse_layer(data.text, layerCount*16)
            break
        layerCount += 1
    return out + "\","

print(parse_file(sys.argv[1]), end="")
