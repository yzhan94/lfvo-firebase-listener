#!/bin/bash
xml=$1
dir=$2
saxon=$3
if [[ -z "$1" || -z "$2" || -z "$3" ]]; then
	echo "Usage: transform.sh [source.xml] [outputDir] [saxonDir]";	
else
	java -jar $saxon  -s:$xml -xsl:FirebaseListener.xsl dir=$dir;	
fi

