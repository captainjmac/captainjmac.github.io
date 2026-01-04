import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog.tsx";
import {HelpIcon} from "@/components/common/icons/HelpIcon.tsx";
import {Logo} from "@/components/common/icons/Logo.tsx";

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="p-2 rounded hover:bg-gray-700 transition-colors">
          <HelpIcon/>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="col-span-full flex items-center gap-3">
              <Logo/>
              <h2 className="text-white">
                About IsoTube
              </h2>
            </div>
          </DialogTitle>
          <DialogDescription>

          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm text-gray-300">
          <p>
            The purpose of IsoTube is to enable you to watch playlists of YouTube videos you have
            pre-prepared, without the possibility of getting consumed by the YouTube algorithm and lost in an
            endless spiral of doom-tubing.
          </p>
          <p>
            Used properly, IsoTube will let you build and watch playlists using an embedded youtube player,
            while isolating yourself from the ability to go off and watch anything outside of your playlists.
          </p>
          <p>
            It is intended to be used alongside a blocker like <a href="https://freedom/to" target="_blank">Freedom</a>,
            which will block normal access to the main Youtube site while still allowing videos to be viewed
            via embedded players.
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}