#!/usr/bin/env perl
#use lib '/Users/shalan/dev/vide_pycharm/csce495one/scripts';
use lib './';
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

print "{\"file\": \"$file\", \"scale\": \"$units\", \"endtime\": \"$endtime\", \"signal\": [\n";

for my $code (keys %{ $vcd }) {
	my $data = "";
	my $name = "$vcd->{$code}{nets}[0]{hier}.$vcd->{$code}{nets}[0]{name}";
	my $size = $vcd->{$code}{nets}[0]{size};

	print "{ \"name\": \"$name\",  \"size\": $size, \"wave\": [";

	$time = 0;

	for my $aref (@{ $vcd->{$code}{tv} }) {
		my $val = @{$aref}[1];
		print "[\"";
		print @{$aref}[0];
		print "\", ";
		if(index($val,"z")>-1) {
           	print "\"z\"";
        } elsif(index($val,"x")>-1) {
        	print "\"x\"";
        }
		else {print "\"".$val."\"";}
		print "], ";
	}
	print "]}, "

}

print "]}\n";

sub bin2dec {
    return unpack("N", pack("B32", substr("0" x 32 . shift, -32)));
}
