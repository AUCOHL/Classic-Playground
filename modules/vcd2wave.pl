#!/usr/bin/env perl
use lib '/home/ahmed/Downloads/vide_pycharm/csce495one/scripts';
use warnings;
use strict;
use Carp qw(croak);
use Verilog::VCD qw(:all);

#use Bit::Vector;


my $file   = shift;

#print "parsing teh file: $file\n";

my $vcd   = parse_vcd($file);
my $units = get_timescale();
my $i = 1;
my $time = 0;
my $endtime = get_endtime();

#print "End Time: $endtime";

print "{\"signal\": [\n";

for my $code (keys %{ $vcd }) {
	my $data = "";
	my $name = "$vcd->{$code}{nets}[0]{hier}.$vcd->{$code}{nets}[0]{name}";

	print "{ \"name\": \"$name\",  \"wave\": \"";

	$time = 0;

	for my $aref (@{ $vcd->{$code}{tv} }) {
        	if(@{$aref}[0] >= $time){
        		for($i=0; $i<@{$aref}[0]-$time-1;$i++){
        			print ".";
        		}
        		$time = @{$aref}[0];
        	}
        	if($vcd->{$code}{nets}[0]{size}>1) {
        		my $bin="";
        		$bin = $bin.@{$aref}[1];
        		$data = $data . "," if($data ne "");

        		if(index($bin,"z")>-1) {
        			# $data = $data."\"Z\"";
        			print "z";
        		}
        		elsif(index($bin,"x")>-1) {
        			#$data = $data."\"X\"";
        			print "x";
        		}
        		else {$data = $data."\"".bin2dec($bin)."\""; print"3";}
           	} else {
        		print @{$aref}[1];

        	}
    }

    if($time<$endtime){
    	#print "\n\n$name: $time\n\n";
    	for($i=0; $i<($endtime-$time);$i++){
        	print ".";
        }
    }
    if($vcd->{$code}{nets}[0]{size}>1) {
    	print "\", \"data\": [".$data."]},";
    } else {
    	print "\"},";
	}
}

print "]}\n";

sub bin2dec {
    return unpack("N", pack("B32", substr("0" x 32 . shift, -32)));
}
