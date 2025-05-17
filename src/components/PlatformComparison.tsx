
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckIcon, XIcon } from "lucide-react";

const features = [
  {
    name: "User-Friendly Interface",
    Trizen: true,
    zoho: true,
    moodle: false,
    talentLms: true,
  },
  {
    name: "No Technical Skills Required",
    Trizen: true,
    zoho: false,
    moodle: false,
    talentLms: true,
  },
  {
    name: "Affordable Pricing",
    Trizen: true,
    zoho: false,
    moodle: true,
    talentLms: false,
  },
  {
    name: "Interactive Live Classes",
    Trizen: true,
    zoho: true,
    moodle: false,
    talentLms: true,
  },
  {
    name: "Mobile-Friendly",
    Trizen: true,
    zoho: true,
    moodle: true,
    talentLms: true,
  },
];

const PlatformComparison = () => {
  return (
    <section className="section-padding">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          See how Trizen stacks up against other learning platforms
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-[300px]">Feature</TableHead>
              <TableHead className="text-center font-bold text-primary">
                Trizen
              </TableHead>
              <TableHead className="text-center">
                Zoho Learn
              </TableHead>
              <TableHead className="text-center">
                Moodle
              </TableHead>
              <TableHead className="text-center">
                TalentLMS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.name}>
                <TableCell className="font-medium">{feature.name}</TableCell>
                <TableCell className="text-center">
                  {feature.Trizen ? (
                    <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <XIcon className="h-5 w-5 text-red-500 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {feature.zoho ? (
                    <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <XIcon className="h-5 w-5 text-red-500 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {feature.moodle ? (
                    <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <XIcon className="h-5 w-5 text-red-500 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {feature.talentLms ? (
                    <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <XIcon className="h-5 w-5 text-red-500 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default PlatformComparison;
